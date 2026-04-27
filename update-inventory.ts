import * as fs from 'fs';
import { inventoryProducts, salesRecords } from './src/lib/sample-data';

// Calculate sales per SKU
const salesCount: Record<string, number> = {};
salesRecords.forEach(record => {
  salesCount[record.sku] = (salesCount[record.sku] || 0) + record.quantity;
});

// Update inventoryProducts
const updatedProducts = inventoryProducts.map(product => {
  const sold = salesCount[product.sku] || 0;
  // Let's set the stock to something realistic. E.g. we had a starting stock of 100-300, minus sold.
  // Or just keep the current totalStock but ensure it's not negative. 
  // Let's make it look like a real running app: some low stock, some out of stock, some healthy stock.
  // We'll generate a random totalStock based on SKU.
  let stock = product.totalStock;
  
  // Make sure at least one is out of stock (0), one is low stock (<=10).
  if (product.sku === 'SKU-005') stock = 0;
  else if (product.sku === 'SKU-002') stock = 5;
  else if (product.sku === 'SKU-007') stock = 8;
  else stock = Math.floor(Math.random() * 150) + 15;

  return {
    ...product,
    sales: sold,
    totalStock: stock
  };
});

// Read the original file to replace only the inventoryProducts part
const tsPath = './src/lib/sample-data.ts';
let content = fs.readFileSync(tsPath, 'utf8');

// The file format is known:
// export const inventoryProducts: InventoryProduct[] = [ ... ];
// export const salesRecords: SalesRecord[] = [ ... ];

const inventoryRegex = /export const inventoryProducts: InventoryProduct\[\] = \[[\s\S]*?\];\n\nexport const salesRecords/;
const newInventoryStr = `export const inventoryProducts: InventoryProduct[] = ${JSON.stringify(updatedProducts, null, 2)};\n\nexport const salesRecords`;

content = content.replace(inventoryRegex, newInventoryStr);

fs.writeFileSync(tsPath, content);
console.log('Successfully updated inventoryProducts with real sales data.');
