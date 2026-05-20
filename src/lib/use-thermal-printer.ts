"use client";

import { useState, useCallback, useRef, useEffect } from "react";

// ─── USB Vendor IDs for known thermal printers ──────────────────────────

const KNOWN_VENDORS = [
  { id: 0x04b8, name: "Epson" },          // Epson
  { id: 0x0416, name: "Bixolon" },         // Bixolon
  { id: 0x0fe6, name: "Star Micronics" },  // Star Micronics
  { id: 0x0521, name: "Custom Engineering" }, // Custom (Epson-based)
  { id: 0x1504, name: "Xprinter" },        // Xprinter / Xpresa
  { id: 0x1fc9, name: "Siang Seng" },      // Many generic thermal printers
];

// ─── Type declarations for WebUSB (since @types/webusb is unavailable) ───

interface USBFilter {
  vendorId?: number;
  productId?: number;
  classCode?: number;
  subclassCode?: number;
  protocolCode?: number;
  serialNumber?: string;
}

interface USBDevice {
  usbVersionMajor: number;
  usbVersionMinor: number;
  usbVersionSubminor: number;
  deviceClass: number;
  deviceSubclass: number;
  deviceProtocol: number;
  vendorId: number;
  productId: number;
  deviceVersionMajor: number;
  deviceVersionMinor: number;
  deviceVersionSubminor: number;
  manufacturerName?: string;
  productName?: string;
  serialNumber?: string;
  configuration?: USBConfiguration;
  configurations: USBConfiguration[];
  opened: boolean;
  open(): Promise<void>;
  close(): Promise<void>;
  selectConfiguration(configurationValue: number): Promise<void>;
  claimInterface(interfaceNumber: number): Promise<void>;
  releaseInterface(interfaceNumber: number): Promise<void>;
  selectAlternateInterface(
    interfaceNumber: number,
    alternateSetting: number,
  ): Promise<void>;
  controlTransferIn(
    setup: USBControlTransferParameters,
    length: number,
  ): Promise<USBInTransferResult>;
  controlTransferOut(
    setup: USBControlTransferParameters,
    data?: BufferSource,
  ): Promise<USBOutTransferResult>;
  clearHalt(direction: "in" | "out", endpointNumber: number): Promise<void>;
  transferIn(
    endpointNumber: number,
    length: number,
  ): Promise<USBInTransferResult>;
  transferOut(
    endpointNumber: number,
    data: BufferSource,
  ): Promise<USBOutTransferResult>;
  isochronousTransferIn(
    endpointNumber: number,
    packetLengths: number[],
  ): Promise<USBIsochronousInTransferResult>;
  isochronousTransferOut(
    endpointNumber: number,
    data: BufferSource,
    packetLengths: number[],
  ): Promise<USBIsochronousOutTransferResult>;
  forget(): Promise<void>;
}

interface USBControlTransferParameters {
  requestType: "standard" | "class" | "vendor";
  recipient: "device" | "interface" | "endpoint" | "other";
  request: number;
  value: number;
  index: number;
}

interface USBInTransferResult {
  data?: DataView;
  status: "ok" | "stall" | "babble";
}

interface USBOutTransferResult {
  bytesWritten: number;
  status: "ok" | "stall";
}

interface USBIsochronousInTransferResult {
  packets: USBIsochronousInTransferPacket[];
  data?: DataView;
}

interface USBIsochronousOutTransferResult {
  packets: USBIsochronousOutTransferPacket[];
}

interface USBIsochronousInTransferPacket {
  data?: DataView;
  status: "ok" | "stall" | "babble";
}

interface USBIsochronousOutTransferPacket {
  bytesWritten: number;
  status: "ok" | "stall";
}

interface USBConfiguration {
  configurationValue: number;
  configurationName?: string;
  interfaces: USBInterface[];
}

interface USBInterface {
  interfaceNumber: number;
  alternate: USBAlternateInterface;
  alternates: USBAlternateInterface[];
  claimed: boolean;
}

interface USBAlternateInterface {
  alternateSetting: number;
  interfaceClass: number;
  interfaceSubclass: number;
  interfaceProtocol: number;
  interfaceName?: string;
  endpoints: USBEndpoint[];
}

interface USBEndpoint {
  endpointNumber: number;
  direction: "in" | "out";
  type: "bulk" | "interrupt" | "isochronous";
  packetSize: number;
}

interface NavigatorUSB {
  getDevices(): Promise<USBDevice[]>;
  requestDevice(filters?: { filters: USBFilter[] }): Promise<USBDevice>;
  addEventListener(
    type: "connect" | "disconnect",
    listener: (event: { device: USBDevice }) => void,
  ): void;
  removeEventListener(
    type: "connect" | "disconnect",
    listener: (event: { device: USBDevice }) => void,
  ): void;
}

// ─── Hook State ──────────────────────────────────────────────────────────

export interface PrinterStatus {
  connected: boolean;
  deviceName: string;
  manufacturer: string;
}

export interface ThermalPrinterState {
  status: PrinterStatus;
  connecting: boolean;
  printing: boolean;
  error: string | null;
  printProgress: string;
}

// ─── React Hook ──────────────────────────────────────────────────────────

export function useThermalPrinter() {
  const [state, setState] = useState<ThermalPrinterState>({
    status: { connected: false, deviceName: "", manufacturer: "" },
    connecting: false,
    printing: false,
    error: null,
    printProgress: "",
  });

  const deviceRef = useRef<USBDevice | null>(null);
  const endpointRef = useRef<number | null>(null);

  const getUSB = useCallback((): NavigatorUSB | null => {
    const nav = navigator as Navigator & { usb?: NavigatorUSB };
    return nav.usb ?? null;
  }, []);

  const isSupported = typeof window !== "undefined" && !!getUSB();

  // ─── Find bulk OUT endpoint ──────────────────────────────────
  const findBulkOutEndpoint = useCallback(
    (device: USBDevice): number | null => {
      if (!device.configuration) return null;
      for (const iface of device.configuration.interfaces) {
        for (const alt of iface.alternates) {
          for (const ep of alt.endpoints) {
            if (ep.direction === "out" && ep.type === "bulk") {
              return ep.endpointNumber;
            }
          }
        }
      }
      return null;
    },
    [],
  );

  // ─── Connect ─────────────────────────────────────────────────
  const connect = useCallback(async () => {
    const usb = getUSB();
    if (!usb) {
      setState((prev) => ({
        ...prev,
        error: "WebUSB tidak didukung di browser ini. Gunakan Chrome/Edge terbaru.",
      }));
      return;
    }

    setState((prev) => ({ ...prev, connecting: true, error: null }));

    try {
      const device = await usb.requestDevice({
        filters: KNOWN_VENDORS.map((v) => ({ vendorId: v.id })),
        // Also accept all USB devices as fallback
      });

      await device.open();
      await device.selectConfiguration(1);
      await device.claimInterface(0);

      const endpoint = findBulkOutEndpoint(device);
      if (endpoint === null) {
        await device.close();
        throw new Error(
          "Tidak dapat menemukan endpoint OUT pada printer. Pastikan printer thermal terhubung dengan benar.",
        );
      }

      deviceRef.current = device;
      endpointRef.current = endpoint;

      const vendorInfo = KNOWN_VENDORS.find(
        (v) => v.id === device.vendorId,
      );
      const deviceName =
        device.productName || vendorInfo?.name || "Printer Thermal";
      const manufacturer = device.manufacturerName || vendorInfo?.name || "";

      setState({
        status: {
          connected: true,
          deviceName,
          manufacturer,
        },
        connecting: false,
        printing: false,
        error: null,
        printProgress: "Printer siap",
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.name === "NotFoundError"
            ? "Tidak ada printer yang dipilih."
            : err.message
          : "Gagal menghubungkan printer.";
      setState((prev) => ({
        ...prev,
        connecting: false,
        error: msg,
        status: { connected: false, deviceName: "", manufacturer: "" },
      }));
    }
  }, [getUSB, findBulkOutEndpoint]);

  // ─── Disconnect ──────────────────────────────────────────────
  const disconnect = useCallback(async () => {
    const device = deviceRef.current;
    if (device) {
      try {
        await device.close();
      } catch {
        // ignore
      }
      deviceRef.current = null;
      endpointRef.current = null;
    }
    setState({
      status: { connected: false, deviceName: "", manufacturer: "" },
      connecting: false,
      printing: false,
      error: null,
      printProgress: "",
    });
  }, []);

  // ─── Print ───────────────────────────────────────────────────
  const print = useCallback(
    async (data: Uint8Array) => {
      const device = deviceRef.current;
      const endpoint = endpointRef.current;

      if (!device || !endpoint) {
        setState((prev) => ({
          ...prev,
          error: "Printer belum terhubung.",
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        printing: true,
        error: null,
        printProgress: "Mengirim data ke printer...",
      }));

      try {
        // Split data into chunks if needed (max 512 bytes per transfer)
        const CHUNK_SIZE = 512;
        let offset = 0;

        while (offset < data.length) {
          const chunk = data.slice(offset, offset + CHUNK_SIZE);
          await device.transferOut(endpoint, chunk.buffer as ArrayBuffer);
          offset += CHUNK_SIZE;
          const percent = Math.min(100, Math.round((offset / data.length) * 100));
          setState((prev) => ({
            ...prev,
            printProgress: `Mencetak... ${percent}%`,
          }));
        }

        setState((prev) => ({
          ...prev,
          printing: false,
          printProgress: "Struk berhasil dicetak!",
        }));
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Gagal mengirim data ke printer.";
        setState((prev) => ({
          ...prev,
          printing: false,
          error: msg,
          printProgress: "",
        }));
      }
    },
    [],
  );

  // ─── Cleanup on unmount ──────────────────────────────────────
  useEffect(() => {
    return () => {
      const device = deviceRef.current;
      if (device && device.opened) {
        device.close().catch(() => {});
      }
    };
  }, []);

  // ─── Reconnect saved device automatically ────────────────────
  const reconnectSaved = useCallback(async () => {
    const usb = getUSB();
    if (!usb) return;

    try {
      const devices = await usb.getDevices();
      if (devices.length > 0) {
        const device = devices[0];
        await device.open();
        await device.selectConfiguration(1);
        await device.claimInterface(0);

        const endpoint = findBulkOutEndpoint(device);
        if (endpoint !== null) {
          deviceRef.current = device;
          endpointRef.current = endpoint;
          const vendorInfo = KNOWN_VENDORS.find(
            (v) => v.id === device.vendorId,
          );
          setState({
            status: {
              connected: true,
              deviceName:
                device.productName || vendorInfo?.name || "Printer Thermal",
              manufacturer:
                device.manufacturerName || vendorInfo?.name || "",
            },
            connecting: false,
            printing: false,
            error: null,
            printProgress: "Printer tersambung kembali",
          });
        }
      }
    } catch {
      // Silently fail — user can reconnect manually
    }
  }, [getUSB, findBulkOutEndpoint]);

  return {
    ...state,
    connect,
    disconnect,
    print,
    isSupported,
    reconnectSaved,
  };
}
