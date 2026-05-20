#!/usr/bin/env python
"""Improve table styling - better hover effects, padding, and filter layout."""
import re

filepath = 'src/app/inventory/page.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

newline = '\r\n' if '\r\n' in content else '\n'

changes = 0

# 1. Improve TableRow hover effects - add transition and better hover bg
for pattern_suffix in [
    'status === "habis" ? "bg-destructive/5 dark:bg-destructive/10" : status === "rendah" ? "bg-amber-50/50 dark:bg-amber-950/10" : ""} ${isSelected ? "bg-primary/5 dark:bg-primary/10" : ""}',
]:
    old_pattern = f'className={{`${{{pattern_suffix}}}`}}'
    new_pattern = f'className={{`${{{pattern_suffix}}} transition-all hover:bg-muted/40`}}'
    
    # Replace with regex - need to account for whitespace
    import re
    # Find all instances where className has this status/isSelected pattern
    pattern = re.escape(old_pattern)
    count = len(re.findall(pattern, content))
    if count > 0:
        content = content.replace(old_pattern, new_pattern)
        changes += count
        print(f"Updated {count} TableRow hover effects")

# 2. Add padding to SKU cells
old = '<TableCell className="font-mono text-xs text-muted-foreground">'
new = '<TableCell className="py-3.5 font-mono text-xs text-muted-foreground">'
count = content.count(old)
if count > 0:
    content = content.replace(old, new)
    changes += count
    print(f"Updated {count} SKU cell padding")

# Add padding to text-right cells
for old_cell in [
    '<TableCell className="text-right">',
    '<TableCell className="text-right text-sm">',
    '<TableCell className="text-right font-medium tabular-nums text-sm">',
]:
    new_cell = old_cell.replace('className="', 'className="py-3.5 ')
    count = content.count(old_cell)
    if count > 0 and old_cell not in ['<TableCell className="text-right py-3.5">', '<TableCell className="text-right py-3.5 text-sm">']:
        content = content.replace(old_cell, new_cell)
        changes += count
        print(f"Updated {count} cells for '{old_cell[:40]}...'")

# Add padding to simple TableCell elements
for old_cell in [
    '<TableCell>\n',
    '<TableCell className="w-10">\n',
]:
    if old_cell == '<TableCell>\n':
        new_cell = '<TableCell className="py-3.5">\n'
    else:
        new_cell = '<TableCell className="w-10 py-3.5">\n'
    count = content.count(old_cell)
    if count > 0:
        # Only replace if they don't already have py-3.5
        temp = content
        temp = temp.replace(old_cell, new_cell)
        if temp != content:
            # Check we didn't double-pad
            if new_cell in content:
                print(f"Skipping {old_cell[:30]} - already padded")
            else:
                content = temp
                changes += count
                print(f"Updated {count} cells for '{old_cell[:30]}...'")

# 3. Update CardTitle to show product count
old_title = '<CardTitle>Daftar Produk</CardTitle>'
new_title = '''          <div className="flex items-center justify-between">
            <CardTitle>Daftar Produk</CardTitle>
            <Badge variant="outline" className="text-xs font-mono">
              {filteredProducts.length} dari {totalProducts} produk
            </Badge>
          </div>'''
new_title = new_title.replace('\n', newline)
count = content.count(old_title)
if count > 0:
    content = content.replace(old_title, new_title)
    changes += count
    print(f"Updated CardTitle")

# 4. Improve filter layout - wrap category and group toggles in a cleaner row
# Find the "Category filter badges" section and add a wrapper div
old_cat_header = f'{newline}              {{/* Category filter badges */}}'
new_cat_header = f'{newline}          </div>{newline}          {{/* Category filter badges */}}'
# This might be tricky, let's just add a separator bar
old_separator = '              {/* Group toggles */}'
new_separator = f'          </div>{newline}          <div className=\"border-t border-border/50 pt-3 mt-1\">{newline}          {{/* Group toggles */}}'
count = content.count(old_separator)
if count > 0:
    content = content.replace(old_separator, new_separator)
    changes += count
    print(f"Updated Group toggles wrapper")

if changes > 0:
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"\nTotal: {changes} changes applied successfully!")
else:
    print("\nNo changes applied.")
    # Debug
    idx = content.find('key={product.sku}')
    if idx >= 0:
        print(f"Found 'key={{product.sku}}' at index {idx}")
        print(repr(content[idx-50:idx+50]))
