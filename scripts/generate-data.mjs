// Generator script: creates a comprehensive, synchronized data.json
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ===================== PRODUCTS =====================
const products = [
  {
    sku: "SKU-002",
    name: "Celana Jeans Slim Fit",
    price: 249000,
    hpp: 155000,
    desc: "Celana jeans slim fit untuk gaya kasual sehari-hari.",
    stores: 2,
  },
  {
    sku: "SKU-005",
    name: "Tas Ransel Waterproof",
    price: 285000,
    hpp: 175000,
    desc: "Tas ransel anti air untuk pekerja harian.",
    stores: 2,
  },
  {
    sku: "SKU-007",
    name: "Sweater Rajut Winter",
    price: 215000,
    hpp: 135000,
    desc: "Sweater hangat dengan pola rajut modern.",
    stores: 2,
  },
  {
    sku: "SKU-012",
    name: "Kaos Polos Oversize",
    price: 79000,
    hpp: 47000,
    desc: "Kaos oversized dengan potongan relaxed fit yang nyaman.",
    stores: 2,
  },
  {
    sku: "SKU-018",
    name: "Sepatu Sneakers Hitam",
    price: 349000,
    hpp: 210000,
    desc: "Sepatu sneakers hitam时尚 untuk gaya sehari-hari yang sporty.",
    stores: 1,
  },
  {
    sku: "SKU-023",
    name: "Hoodie Basic",
    price: 189000,
    hpp: 115000,
    desc: "Hoodie basic nyaman dengan bahan cotton fleece tebal.",
    stores: 2,
  },
  {
    sku: "SKU-029",
    name: "Kemeja Flannel",
    price: 139000,
    hpp: 85000,
    desc: "Kemeja flannel kotak-kotak gaya casual smart.",
    stores: 2,
  },
  {
    sku: "SKU-035",
    name: "Botol Minum Tumbler",
    price: 69000,
    hpp: 40000,
    desc: "Botol minum tumbler stainless tahan panas dan dingin.",
    stores: 2,
  },
  {
    sku: "SKU-041",
    name: "Jaket Parka Anti Air",
    price: 379000,
    hpp: 230000,
    desc: "Jaket parka anti air dengan hoodie untuk musim hujan.",
    stores: 1,
  },
  {
    sku: "SKU-048",
    name: "Dompet Kulit Premium",
    price: 159000,
    hpp: 95000,
    desc: "Dompet kulit asli premium dengan banyak kompartemen.",
    stores: 2,
  },
];

// ===================== SELLERS / STORES =====================
const sellers = [
  { sellerName: "Fairuz", tokoName: "Toko Fairuz" },
  { sellerName: "Faiz Fairuz", tokoName: "Toko Faiz" },
];

// ===================== BUYER NAMES =====================
const buyers = [
  "Ahmad Fauzi", "Siti Nurhaliza", "Budi Santoso", "Dewi Lestari",
  "Rizki Pratama", "Maya Sari", "Andi Wijaya", "Linda Kusuma",
  "Hendra Gunawan", "Ratna Sari", "Dimas Ardianto", "Putri Ayu",
  "Agus Wijaya", "Rina Marlina", "Fajar Nugroho", "Intan Permata",
  "Reza Pahlevi", "Nadia Safitri", "Doni Prasetyo", "Wulan Sari",
  "Irfan Hakim", "Tari Lestari", "Gilang Ramadhan", "Siska Dewi",
  "Aditya Pratama", "Mega Fitriani", "Rendy Kurniawan", "Vania Putri",
];

const addresses = [
  "Jl. Merdeka No. 123, Bandung, Jawa Barat",
  "Jl. Sudirman No. 456, Jakarta Selatan",
  "Jl. Diponegoro No. 789, Surabaya, Jawa Timur",
  "Jl. Gatot Subroto No. 321, Medan, Sumatera Utara",
  "Jl. Ahmad Yani No. 654, Makassar, Sulawesi Selatan",
  "Jl. Pahlawan No. 987, Yogyakarta, DI Yogyakarta",
  "Jl. Cyber No. 111, BSD City, Tangerang Selatan",
  "Jl. Asia Afrika No. 222, Bandung, Jawa Barat",
  "Jl. Thamrin No. 333, Jakarta Pusat",
  "Jl. Pemuda No. 444, Semarang, Jawa Tengah",
  "Jl. Gajah Mada No. 555, Denpasar, Bali",
  "Jl. Siliwangi No. 666, Malang, Jawa Timur",
  "Jl. Veteran No. 777, Solo, Jawa Tengah",
  "Jl. Dipatiukur No. 888, Bandung, Jawa Barat",
  "Jl. Rasuna Said No. 999, Jakarta Selatan",
  "Jl. Imam Bonjol No. 111, Palembang, Sumatera Selatan",
  "Jl. Teuku Umar No. 222, Padang, Sumatera Barat",
  "Jl. Sam Ratulangi No. 333, Manado, Sulawesi Utara",
  "Jl. Antasari No. 444, Banjarmasin, Kalimantan Selatan",
  "Jl. Sultan Hasanuddin No. 555, Mataram, NTB",
];

// ===================== ORDER GENERATION =====================
const statuses = ["selesai", "selesai", "selesai", "dikirim", "diproses", "dibatalkan"];
const statusWeights = [0.55, 0.2, 0.15, 0.1]; // selesai, dikirim, diproses, dibatalkan

function weightedStatus(rng) {
  const r = rng();
  if (r < statusWeights[0]) return "selesai";
  if (r < statusWeights[0] + statusWeights[1]) return "dikirim";
  if (r < statusWeights[0] + statusWeights[1] + statusWeights[2]) return "diproses";
  return "dibatalkan";
}

function deterministicRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 16807 + 1) % 2147483647;
    return s / 2147483647;
  };
}

const salesMap = new Map(products.map((p) => [p.sku, 0]));

let orderId = 1;
let itemId = 1;
const orders = [];
let orderIndex = 0;

function generateOrdersForMonth(year, month, count, rng) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < count; i++) {
    const day = Math.floor(rng() * (daysInMonth - 1)) + 1;
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const seller = sellers[Math.floor(rng() * sellers.length)];
    const buyer = buyers[Math.floor(rng() * buyers.length)];
    const address = addresses[Math.floor(rng() * addresses.length)];
    const status = weightedStatus(rng);

    const numItems = Math.floor(rng() * 3) + 1;
    const usedSku = new Set();
    const items = [];
    let subtotal = 0;

    for (let j = 0; j < numItems; j++) {
      let sku;
      do {
        sku = products[Math.floor(rng() * products.length)].sku;
      } while (usedSku.has(sku));
      usedSku.add(sku);

      const product = products.find((p) => p.sku === sku);
      const qty = Math.floor(rng() * 2) + 1;
      const itemSubtotal = product.price * qty;
      subtotal += itemSubtotal;

      items.push({
        id: itemId++,
        sku: product.sku,
        nama_produk: product.name,
        harga: product.price,
        hpp: product.hpp,
        quantity: qty,
        subtotal: itemSubtotal,
      });

      salesMap.set(sku, salesMap.get(sku) + qty);
    }

    const ongkir = Math.max(10000, Math.min(25000, Math.round(subtotal * 0.04)));
    const grandTotal = subtotal + ongkir;

    orders.push({
      id: orderId++,
      nomor_order: `SPX-${String(orderIndex + 1).padStart(6, "0")}`,
      tanggal_pesanan: dateStr,
      user_id: `usr_${10000 + Math.floor(rng() * 90000)}`,
      seller_name: seller.sellerName,
      nama_pembeli: buyer,
      alamat_pengiriman: address,
      nama_toko_shopee: seller.tokoName,
      status_pesanan: status,
      items: items,
      subtotal: subtotal,
      ongkir: ongkir,
      grand_total: grandTotal,
    });

    orderIndex++;
  }
}

const rng = deterministicRandom(42);

const monthlyCounts = [
  { month: 0, count: 10 },
  { month: 1, count: 8 },
  { month: 2, count: 12 },
  { month: 3, count: 10 },
  { month: 4, count: 11 },
  { month: 5, count: 9 },
];

for (const mc of monthlyCounts) {
  generateOrdersForMonth(2026, mc.month, mc.count, rng);
}

// ===================== COMPUTE INVENTORY =====================
const overrides = new Map([
  ["SKU-002", 0],   // Celana Jeans - HABIS
  ["SKU-005", 3],   // Tas Ransel - RENDAH
  ["SKU-007", 8],   // Sweater - RENDAH
  ["SKU-012", 0],   // Kaos Oversize - HABIS
  ["SKU-029", 0],   // Kemeja Flannel - HABIS
  ["SKU-041", 6],   // Jaket Parka - RENDAH
]);

// Default stock for products not in overrides (deterministic by SKU)
const defaultStocks = new Map([
  ["SKU-018", 42],  // Sepatu Sneakers Hitam
  ["SKU-023", 55],  // Hoodie Basic
  ["SKU-035", 72],  // Botol Minum Tumbler
  ["SKU-048", 28],  // Dompet Kulit Premium
]);

const inventoryProducts = products.map((p) => {
  const sold = salesMap.get(p.sku);
  const stock = overrides.has(p.sku) ? overrides.get(p.sku) : defaultStocks.get(p.sku);
  return {
    sku: p.sku,
    name: p.name,
    price: p.price,
    hpp: p.hpp,
    totalStock: stock,
    description: p.desc,
    connectedStores: p.stores,
    sales: sold,
  };
});

// ===================== WRITE FILE =====================
const output = {
  inventoryProducts,
  orders,
  sampleStoreCount: sellers.length,
};

const outputPath = path.resolve(__dirname, "..", "data.json");
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), "utf8");

console.log(`Generated ${inventoryProducts.length} products and ${orders.length} orders.`);
console.log(`Output: ${outputPath}`);

console.log("\n--- Sales per Product ---");
for (const p of inventoryProducts) {
  const status = p.totalStock === 0 ? "HABIS" : p.totalStock <= 10 ? "RENDAH" : "AMAN";
  console.log(
    `${p.sku}: ${p.name.padEnd(30)} stock=${String(p.totalStock).padStart(3)}  sold=${String(p.sales).padStart(2)}  ${status}`,
  );
}

console.log("\n--- Orders per Seller ---");
const sellerCounts = {};
for (const o of orders) {
  sellerCounts[o.seller_name] = (sellerCounts[o.seller_name] || 0) + 1;
}
for (const [s, c] of Object.entries(sellerCounts)) {
  console.log(`  ${s}: ${c} orders`);
}

console.log("\n--- Orders per Month ---");
const monthCounts = {};
for (const o of orders) {
  const k = o.tanggal_pesanan.slice(0, 7);
  monthCounts[k] = (monthCounts[k] || 0) + 1;
}
for (const [k, c] of Object.entries(monthCounts).sort()) {
  console.log(`  ${k}: ${c} orders`);
}
