-- 添加額外的表格來支援新功能

-- 1. 付款記錄表
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    method VARCHAR(20) NOT NULL CHECK (method IN ('cash', 'card', 'mobile', 'voucher', 'points')),
    amount DECIMAL(10,2) NOT NULL,
    received_amount DECIMAL(10,2),
    change_amount DECIMAL(10,2),
    transaction_id VARCHAR(100),
    card_last_four VARCHAR(4),
    mobile_provider VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 發票表
CREATE TABLE IF NOT EXISTS invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('receipt', 'personal', 'company')),
    invoice_number VARCHAR(50),
    tax_id VARCHAR(20),
    company_name VARCHAR(200),
    buyer_email VARCHAR(100),
    buyer_phone VARCHAR(20),
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    void_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 收據表
CREATE TABLE IF NOT EXISTS receipts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    items JSONB NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    received_amount DECIMAL(10,2),
    change_amount DECIMAL(10,2),
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    printed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 預約表
CREATE TABLE IF NOT EXISTS reservations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_id UUID REFERENCES tables(id) ON DELETE CASCADE,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    party_size INTEGER NOT NULL CHECK (party_size > 0),
    reservation_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 120,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'seated', 'cancelled', 'no_show')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 桌位使用會話表
CREATE TABLE IF NOT EXISTS table_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_id UUID REFERENCES tables(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    customer_count INTEGER,
    total_revenue DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 桌位狀態歷史表
CREATE TABLE IF NOT EXISTS table_status_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_id UUID REFERENCES tables(id) ON DELETE CASCADE,
    previous_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    changed_by UUID, -- 可以參考員工表，暫時不設外鍵
    reason VARCHAR(200),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 確保 orders 表有必要的欄位
DO $$
BEGIN
    -- 添加 payment_status 欄位如果不存在
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='orders' AND column_name='payment_status'
    ) THEN
        ALTER TABLE orders ADD COLUMN payment_status VARCHAR(20) DEFAULT 'pending' 
        CHECK (payment_status IN ('pending', 'paid', 'refunded', 'partial'));
    END IF;

    -- 添加 payment_method 欄位如果不存在
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='orders' AND column_name='payment_method'
    ) THEN
        ALTER TABLE orders ADD COLUMN payment_method VARCHAR(20) 
        CHECK (payment_method IN ('cash', 'card', 'mobile', 'voucher', 'points'));
    END IF;

    -- 添加 served_at 欄位如果不存在
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='orders' AND column_name='served_at'
    ) THEN
        ALTER TABLE orders ADD COLUMN served_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 8. 確保 order_items 表有狀態欄位
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='order_items' AND column_name='status'
    ) THEN
        ALTER TABLE order_items ADD COLUMN status VARCHAR(20) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'preparing', 'ready', 'served'));
    END IF;
END $$;

-- 9. 確保 tables 表有必要的欄位
DO $$
BEGIN
    -- 添加 reserved_by 欄位
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='tables' AND column_name='reserved_by'
    ) THEN
        ALTER TABLE tables ADD COLUMN reserved_by VARCHAR(100);
    END IF;

    -- 添加 reserved_at 欄位
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='tables' AND column_name='reserved_at'
    ) THEN
        ALTER TABLE tables ADD COLUMN reserved_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- 添加 reserved_until 欄位
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='tables' AND column_name='reserved_until'
    ) THEN
        ALTER TABLE tables ADD COLUMN reserved_until TIMESTAMP WITH TIME ZONE;
    END IF;

    -- 添加 last_cleaned 欄位
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='tables' AND column_name='last_cleaned'
    ) THEN
        ALTER TABLE tables ADD COLUMN last_cleaned TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 10. 建立索引來優化查詢效能
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_receipts_order_id ON receipts(order_id);
CREATE INDEX IF NOT EXISTS idx_receipts_receipt_number ON receipts(receipt_number);
CREATE INDEX IF NOT EXISTS idx_reservations_table_id ON reservations(table_id);
CREATE INDEX IF NOT EXISTS idx_reservations_reservation_time ON reservations(reservation_time);
CREATE INDEX IF NOT EXISTS idx_table_sessions_table_id ON table_sessions(table_id);
CREATE INDEX IF NOT EXISTS idx_table_sessions_started_at ON table_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_table_status_history_table_id ON table_status_history(table_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);

-- 11. 插入測試資料

-- 測試付款記錄
INSERT INTO payments (order_id, method, amount, received_amount, change_amount, status, processed_at)
SELECT 
    id,
    'cash',
    total_amount,
    total_amount + 50,
    50,
    'completed',
    created_at + INTERVAL '1 hour'
FROM orders 
WHERE status = 'served'
ON CONFLICT DO NOTHING;

-- 測試預約資料
INSERT INTO reservations (table_id, customer_name, customer_phone, party_size, reservation_time, status)
SELECT 
    t.id,
    '預約客戶' || ROW_NUMBER() OVER(),
    '0912' || LPAD((ROW_NUMBER() OVER())::text, 6, '0'),
    (RANDOM() * 4 + 2)::INTEGER,
    NOW() + INTERVAL '1 day' + (ROW_NUMBER() OVER()) * INTERVAL '2 hours',
    'confirmed'
FROM tables t
WHERE t.status = 'available'
LIMIT 5
ON CONFLICT DO NOTHING;

-- 測試桌位使用會話
INSERT INTO table_sessions (table_id, started_at, ended_at, duration_minutes, customer_count, total_revenue)
SELECT 
    t.id,
    NOW() - INTERVAL '4 hours',
    NOW() - INTERVAL '2 hours',
    120,
    (RANDOM() * 4 + 1)::INTEGER,
    (RANDOM() * 800 + 200)::DECIMAL(10,2)
FROM tables t
LIMIT 8
ON CONFLICT DO NOTHING;

-- 更新 orders 表的 payment_status
UPDATE orders 
SET payment_status = CASE 
    WHEN status = 'served' THEN 'paid'
    WHEN status IN ('ready', 'preparing') THEN 'pending'
    ELSE 'pending'
END
WHERE payment_status IS NULL;

COMMIT;
