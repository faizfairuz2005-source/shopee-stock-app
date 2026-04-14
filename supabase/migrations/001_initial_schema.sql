-- Create shopee_shops table to store connected Shopee stores
CREATE TABLE IF NOT EXISTS shopee_shops (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shop_id BIGINT NOT NULL UNIQUE,
  region VARCHAR(10) NOT NULL DEFAULT 'ID',
  shop_name VARCHAR(255) NOT NULL,
  shop_code VARCHAR(100),
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inventory_cache table to cache Shopee product data
CREATE TABLE IF NOT EXISTS inventory_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id BIGINT REFERENCES shopee_shops(shop_id) ON DELETE CASCADE NOT NULL,
  item_id BIGINT NOT NULL,
  item_name VARCHAR(500) NOT NULL,
  item_sku VARCHAR(255),
  description TEXT,
  image_url TEXT,
  price DECIMAL(12, 2),
  currency VARCHAR(10) DEFAULT 'IDR',
  stock_total INTEGER DEFAULT 0,
  sales INTEGER DEFAULT 0,
  historical_sold INTEGER DEFAULT 0,
  item_status VARCHAR(50),
  has_model BOOLEAN DEFAULT FALSE,
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(shop_id, item_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_shopee_shops_user_id ON shopee_shops(user_id);
CREATE INDEX IF NOT EXISTS idx_shopee_shops_shop_id ON shopee_shops(shop_id);
CREATE INDEX IF NOT EXISTS idx_inventory_cache_shop_id ON inventory_cache(shop_id);
CREATE INDEX IF NOT EXISTS idx_inventory_cache_item_id ON inventory_cache(item_id);

-- Enable Row Level Security
ALTER TABLE shopee_shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_cache ENABLE ROW LEVEL SECURITY;

-- Policies for shopee_shops
CREATE POLICY "Users can view their own shops"
  ON shopee_shops FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own shops"
  ON shopee_shops FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shops"
  ON shopee_shops FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shops"
  ON shopee_shops FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for inventory_cache
CREATE POLICY "Users can view their own inventory"
  ON inventory_cache FOR SELECT
  USING (shop_id IN (SELECT shop_id FROM shopee_shops WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own inventory"
  ON inventory_cache FOR INSERT
  WITH CHECK (shop_id IN (SELECT shop_id FROM shopee_shops WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own inventory"
  ON inventory_cache FOR UPDATE
  USING (shop_id IN (SELECT shop_id FROM shopee_shops WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own inventory"
  ON inventory_cache FOR DELETE
  USING (shop_id IN (SELECT shop_id FROM shopee_shops WHERE user_id = auth.uid()));
