-- 餐後結帳系統資料庫設置
-- 執行日期: 2025-08-02

-- 1. 為 orders 表添加結帳狀態欄位
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS checkout_status VARCHAR(20) DEFAULT 'pending';

-- 更新現有訂單的結帳狀態
UPDATE orders 
SET checkout_status = CASE 
  WHEN status = 'completed' THEN 'ready'
  WHEN status = 'cancelled' OR status = 'refunded' THEN 'paid'
  ELSE 'pending'
END
WHERE checkout_status IS NULL OR checkout_status = 'pending';

-- 2. 創建支付記錄表
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  method VARCHAR(20) NOT NULL CHECK (method IN ('cash', 'card', 'mobile', 'voucher', 'points')),
  amount DECIMAL(10,2) NOT NULL,
  service_fee DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) GENERATED ALWAYS AS (amount + service_fee) STORED,
  received_amount DECIMAL(10,2),
  change_amount DECIMAL(10,2),
  transaction_id VARCHAR(100),
  card_last_four VARCHAR(4),
  mobile_provider VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  notes TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 創建結帳會話表 (用於管理結帳流程)
CREATE TABLE IF NOT EXISTS checkout_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  table_id UUID REFERENCES tables(id),
  session_type VARCHAR(20) DEFAULT 'post_meal' CHECK (session_type IN ('immediate', 'post_meal')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  started_by VARCHAR(100),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 創建收據記錄表
CREATE TABLE IF NOT EXISTS receipts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  receipt_number VARCHAR(50) UNIQUE NOT NULL,
  receipt_type VARCHAR(20) DEFAULT 'payment' CHECK (receipt_type IN ('payment', 'refund', 'void')),
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  service_fee DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(20),
  is_printed BOOLEAN DEFAULT FALSE,
  print_count INTEGER DEFAULT 0,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  voided_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 為支付表添加索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_method ON payments(method);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_processed_at ON payments(processed_at);

-- 6. 為結帳會話表添加索引
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_order_id ON checkout_sessions(order_id);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_table_id ON checkout_sessions(table_id);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_status ON checkout_sessions(status);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_started_at ON checkout_sessions(started_at);

-- 7. 為收據表添加索引
CREATE INDEX IF NOT EXISTS idx_receipts_order_id ON receipts(order_id);
CREATE INDEX IF NOT EXISTS idx_receipts_payment_id ON receipts(payment_id);
CREATE INDEX IF NOT EXISTS idx_receipts_receipt_number ON receipts(receipt_number);
CREATE INDEX IF NOT EXISTS idx_receipts_issued_at ON receipts(issued_at);

-- 8. 為 orders 表的新欄位添加索引
CREATE INDEX IF NOT EXISTS idx_orders_checkout_status ON orders(checkout_status);

-- 9. 創建視圖：結帳摘要
CREATE OR REPLACE VIEW checkout_summary AS
SELECT 
  o.id,
  o.order_number,
  o.table_id,
  o.table_number,
  o.customer_name,
  o.status,
  o.checkout_status,
  o.total_amount,
  o.created_at,
  o.updated_at,
  p.method as payment_method,
  p.amount as payment_amount,
  p.service_fee,
  p.total_amount as paid_amount,
  p.processed_at as payment_time,
  cs.session_type,
  cs.started_at as checkout_started,
  cs.completed_at as checkout_completed
FROM orders o
LEFT JOIN payments p ON o.id = p.order_id AND p.status = 'completed'
LEFT JOIN checkout_sessions cs ON o.id = cs.order_id
WHERE o.status IN ('completed', 'ready')
ORDER BY o.created_at DESC;

-- 10. 創建函數：自動生成收據編號
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TEXT AS $$
DECLARE
  current_date_str TEXT;
  sequence_num INTEGER;
  receipt_num TEXT;
BEGIN
  -- 獲取當前日期 (YYYYMMDD 格式)
  current_date_str := TO_CHAR(NOW(), 'YYYYMMDD');
  
  -- 獲取今日的序列號
  SELECT COALESCE(MAX(
    CAST(
      SUBSTRING(receipt_number FROM LENGTH(current_date_str) + 2) 
      AS INTEGER
    )
  ), 0) + 1
  INTO sequence_num
  FROM receipts 
  WHERE receipt_number LIKE current_date_str || '%';
  
  -- 生成收據編號 (格式: YYYYMMDD-NNNN)
  receipt_num := current_date_str || '-' || LPAD(sequence_num::TEXT, 4, '0');
  
  RETURN receipt_num;
END;
$$ LANGUAGE plpgsql;

-- 11. 創建觸發器：自動更新時間戳
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 為相關表添加更新時間觸發器
DROP TRIGGER IF EXISTS trigger_payments_updated_at ON payments;
CREATE TRIGGER trigger_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trigger_checkout_sessions_updated_at ON checkout_sessions;
CREATE TRIGGER trigger_checkout_sessions_updated_at
  BEFORE UPDATE ON checkout_sessions
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- 12. 插入示範資料

-- 更新一些現有訂單為可結帳狀態
UPDATE orders 
SET 
  status = 'completed',
  checkout_status = 'ready'
WHERE status = 'preparing' 
  AND created_at >= NOW() - INTERVAL '2 hours'
LIMIT 3;

-- 插入測試支付記錄
INSERT INTO payments (order_id, method, amount, service_fee, status, processed_at)
SELECT 
  id,
  'cash',
  total_amount,
  0,
  'completed',
  NOW() - INTERVAL '10 minutes'
FROM orders 
WHERE checkout_status = 'paid'
LIMIT 2;

-- 13. 設置行級安全性 (RLS) 
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- 為匿名用戶創建基本查詢權限
CREATE POLICY "Allow anonymous read payments" ON payments FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert payments" ON payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update payments" ON payments FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous read checkout_sessions" ON checkout_sessions FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert checkout_sessions" ON checkout_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update checkout_sessions" ON checkout_sessions FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous read receipts" ON receipts FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert receipts" ON receipts FOR INSERT WITH CHECK (true);

-- 14. 創建資料庫函數：處理完整結帳流程
CREATE OR REPLACE FUNCTION process_checkout(
  p_order_id UUID,
  p_payment_method VARCHAR(20),
  p_amount DECIMAL(10,2),
  p_service_fee DECIMAL(10,2) DEFAULT 0,
  p_received_amount DECIMAL(10,2) DEFAULT NULL,
  p_transaction_id VARCHAR(100) DEFAULT NULL,
  p_card_last_four VARCHAR(4) DEFAULT NULL,
  p_mobile_provider VARCHAR(50) DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_payment_id UUID;
  v_receipt_number TEXT;
  v_table_id UUID;
  result JSON;
BEGIN
  -- 獲取訂單的桌台ID
  SELECT table_id INTO v_table_id FROM orders WHERE id = p_order_id;
  
  -- 插入支付記錄
  INSERT INTO payments (
    order_id, method, amount, service_fee, received_amount,
    transaction_id, card_last_four, mobile_provider,
    status, processed_at
  ) VALUES (
    p_order_id, p_payment_method, p_amount, p_service_fee, p_received_amount,
    p_transaction_id, p_card_last_four, p_mobile_provider,
    'completed', NOW()
  ) RETURNING id INTO v_payment_id;
  
  -- 更新訂單結帳狀態
  UPDATE orders 
  SET checkout_status = 'paid', updated_at = NOW()
  WHERE id = p_order_id;
  
  -- 釋放桌台
  UPDATE tables 
  SET status = 'available', updated_at = NOW()
  WHERE id = v_table_id;
  
  -- 生成收據編號
  v_receipt_number := generate_receipt_number();
  
  -- 插入收據記錄
  INSERT INTO receipts (
    order_id, payment_id, receipt_number, subtotal, 
    service_fee, total_amount, payment_method
  ) VALUES (
    p_order_id, v_payment_id, v_receipt_number, p_amount,
    p_service_fee, p_amount + p_service_fee, p_payment_method
  );
  
  -- 返回結果
  result := json_build_object(
    'success', true,
    'payment_id', v_payment_id,
    'receipt_number', v_receipt_number,
    'total_amount', p_amount + p_service_fee,
    'message', '結帳完成'
  );
  
  RETURN result;
  
EXCEPTION WHEN OTHERS THEN
  -- 錯誤處理
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM,
    'message', '結帳失敗'
  );
END;
$$ LANGUAGE plpgsql;

-- 15. 完成訊息
SELECT 
  '🎉 餐後結帳系統資料庫設置完成！' as message,
  NOW() as completed_at;

-- 顯示設置摘要
SELECT 
  '📊 設置摘要' as info,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('payments', 'checkout_sessions', 'receipts')) as new_tables_created,
  (SELECT COUNT(*) FROM orders WHERE checkout_status = 'ready') as orders_ready_for_checkout,
  (SELECT COUNT(*) FROM payments) as payment_records;
