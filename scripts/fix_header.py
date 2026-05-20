#!/usr/bin/env python
"""Replace the inventory page header with the new gradient design."""
import re

filepath = 'src/app/inventory/page.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

old_header = '''      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Stok Sentral</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola dan pantau stok produk dari semua toko terhubung
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton
            data={products as unknown as Record<string, unknown>[]}
            columns={INVENTORY_EXPORT_COLUMNS}
            filenamePrefix="Inventory"
            label="Export Semua Produk"
          />
          <Can permission="inventory.edit" fallback={null}>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Tambah Produk
            </Button>
          </Can>
        </div>'''

new_header = '''      {/* Page Header */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-gradient-to-r from-primary/[0.04] via-background to-background shadow-sm">
        <div className="px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">Stok Sentral</h1>
                  <p className="text-sm text-muted-foreground">
                    Kelola dan pantau stok produk dari semua toko terhubung
                  </p>
                </div>
              </div>
              {/* Quick stats chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1.5">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1 text-xs font-medium shadow-sm">
                  <Package className="h-3.5 w-3.5 text-primary" />
                  <span className="text-muted-foreground">Produk:</span>
                  <span>{totalProducts}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1 text-xs font-medium shadow-sm">
                  <Package className="h-3.5 w-3.5 text-primary" />
                  <span className="text-muted-foreground">Stok:</span>
                  <span>{totalStock.toLocaleString("id-ID")}</span>
                </div>
                {lowStockCount > 0 && (
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20 px-3 py-1 text-xs font-medium shadow-sm">
                    <TrendingDown className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-amber-600 dark:text-amber-400">{lowStockCount} rendah</span>
                  </div>
                )}
                {outOfStockCount > 0 && (
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20 px-3 py-1 text-xs font-medium shadow-sm">
                    <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                    <span className="text-red-600 dark:text-red-400">{outOfStockCount} habis</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <ExportButton
                data={products as unknown as Record<string, unknown>[]}
                columns={INVENTORY_EXPORT_COLUMNS}
                filenamePrefix="Inventory"
                label="Export"
              />
              <Can permission="inventory.edit" fallback={null}>
                <Button className="gap-2 shadow-sm">
                  <Plus className="h-4 w-4" />
                  Tambah Produk
                </Button>
              </Can>
            </div>
          </div>
        </div>
      </div>'''

count = content.count(old_header)
print(f"Found {count} occurrences of old header")

if count > 0:
    content = content.replace(old_header, new_header, 1)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Successfully replaced header!")
else:
    print("Old header not found. Checking for \\r\\n variant...")
    # Try with \r\n
    old_header_crlf = old_header.replace('\n', '\r\n')
    count = content.count(old_header_crlf)
    print(f"Found {count} occurrences of old header (CRLF)")
    if count > 0:
        new_header_crlf = new_header.replace('\n', '\r\n')
        content = content.replace(old_header_crlf, new_header_crlf, 1)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print("Successfully replaced header (CRLF)!")
    else:
        print("Still not found. Trying case-insensitive search for key parts...")
        # Debug: find where "Page Header" is
        idx = content.find('Page Header')
        if idx >= 0:
            print(f"Found 'Page Header' at index {idx}")
            print("Context around it:")
            print(repr(content[idx:idx+500]))
