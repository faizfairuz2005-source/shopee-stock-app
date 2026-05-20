#!/usr/bin/env python
"""Refine summary cards with better visual hierarchy, fix ternary syntax."""
filepath = 'src/app/inventory/page.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

newline = '\r\n' if '\r\n' in content else '\n'

old_cards = f'''      {{/* Summary Cards */}}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm transition-all hover:border-primary/20 hover:shadow-md hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Total Produk</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Package className="h-4 w-4 text-primary" />
            </div>
          </div>
          <p className="text-3xl font-bold tracking-tight">{{totalProducts}}</p>
          <p className="mt-1 text-xs text-muted-foreground">Produk aktif dalam inventori</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm transition-all hover:border-primary/20 hover:shadow-md hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Total Stok</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Store className="h-4 w-4 text-primary" />
            </div>
          </div>
          <p className="text-3xl font-bold tracking-tight">{{totalStock.toLocaleString("id-ID")}}</p>
          <p className="mt-1 text-xs text-muted-foreground">Unit tersedia di semua rak</p>
        </div>
        <div className={{"rounded-xl border p-5 shadow-sm transition-all hover:-translate-y-0.5 " + (lowStockCount > 0 ? "border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/10" : "border-border/60 bg-card hover:border-amber-200 dark:hover:border-amber-800")}}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Stok Rendah</span>
            <div className={{"flex h-8 w-8 items-center justify-center rounded-lg " + (lowStockCount > 0 ? "bg-amber-100 dark:bg-amber-900/30" : "bg-muted")}}>
              <TrendingDown className={{"h-4 w-4 " + (lowStockCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}} />
            </div>
          </div>
          <p className={{"text-3xl font-bold tracking-tight " + (lowStockCount > 0 ? "text-amber-600 dark:text-amber-400" : "")}}>{{lowStockCount}}</p>
          <p className="mt-1 text-xs text-muted-foreground">Produk perlu restok segera</p>
        </div>
        <div className={{"rounded-xl border p-5 shadow-sm transition-all hover:-translate-y-0.5 " + (outOfStockCount > 0 ? "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/10" : "border-border/60 bg-card hover:border-red-200 dark:hover:border-red-800")}}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Stok Habis</span>
            <div className={{"flex h-8 w-8 items-center justify-center rounded-lg " + (outOfStockCount > 0 ? "bg-red-100 dark:bg-red-900/30" : "bg-muted")}}>
              <AlertCircle className={{"h-4 w-4 " + (outOfStockCount > 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground")}} />
            </div>
          </div>
          <p className={{"text-3xl font-bold tracking-tight " + (outOfStockCount > 0 ? "text-red-600 dark:text-red-400" : "")}}>{{outOfStockCount}}</p>
          <p className="mt-1 text-xs text-muted-foreground">Produk kosong tanpa stok</p>
        </div>
      </div>'''

# The actual content might have the new cards already, let me check first
idx = content.find('Total Produk</span>')
if idx >= 0 and 'inventori' in content[idx:idx+200]:
    print("New cards already present - checking for bad ternary syntax...")
    # Check for Python-style if/else
    if 'if lowStockCount > 0 else' in content:
        print("Found Python-style ternary! Need to fix.")
        # Fix the Python-style if/else - replace with JS ternary
        content = content.replace(
            'if lowStockCount > 0 else ',
            '? ',
        )
        content = content.replace(
            ': "border-border/60 bg-card hover:border-amber-200 dark:hover:border-amber-800"',
            ' : "border-border/60 bg-card hover:border-amber-200 dark:hover:border-amber-800"',
        )
        # Fix the specific pattern
        import re
        # Replace Python-style ternary in className expressions
        # Pattern: "value" if condition else "other value"
        content = re.sub(
            r'"([^"]*)" if (\w+) > 0 else "([^"]*)"',
            r'\2 > 0 ? "\1" : "\3"',
            content
        )
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print("Fixed Python-style ternaries!")
    else:
        print("No Python-style ternaries found - cards look OK")
else:
    print("New cards not found - need to replace old cards")
    # Try to find old cards
    old_cards_idx = content.find('Summary Cards')
    if old_cards_idx >= 0:
        print(f"Found 'Summary Cards' at index {old_cards_idx}")
        # Show the old cards 
        print(repr(content[old_cards_idx:old_cards_idx+500]))
