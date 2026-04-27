import { getAppData } from "@/app/actions";
import { OrdersClient } from "./orders-client";

export default async function OrdersPage() {
  const { salesRecords, inventoryProducts } = await getAppData();
  
  return <OrdersClient initialOrders={salesRecords} products={inventoryProducts} />;
}
