-- 創建外帶序列表
CREATE TABLE IF NOT EXISTS takeaway_sequences (
  date DATE PRIMARY KEY,
  last_sequence INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 添加註釋
COMMENT ON TABLE takeaway_sequences IS '外帶訂單序列號管理表';
COMMENT ON COLUMN takeaway_sequences.date IS '日期';
COMMENT ON COLUMN takeaway_sequences.last_sequence IS '當日最後使用的序列號';

-- 創建更新時間觸發器
CREATE OR REPLACE FUNCTION update_takeaway_sequences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_takeaway_sequences_updated_at_trigger ON takeaway_sequences;
CREATE TRIGGER update_takeaway_sequences_updated_at_trigger
  BEFORE UPDATE ON takeaway_sequences
  FOR EACH ROW
  EXECUTE FUNCTION update_takeaway_sequences_updated_at();

-- 插入今日初始記錄（如果不存在）
INSERT INTO takeaway_sequences (date, last_sequence)
VALUES (CURRENT_DATE, 0)
ON CONFLICT (date) DO NOTHING;
