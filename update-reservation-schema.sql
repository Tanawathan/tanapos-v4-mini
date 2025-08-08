
      -- 添加新欄位
      DO $$
      BEGIN
        -- 添加成人人數欄位
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'table_reservations' AND column_name = 'adult_count'
        ) THEN
          ALTER TABLE table_reservations ADD COLUMN adult_count INTEGER DEFAULT 0;
        END IF;

        -- 添加兒童人數欄位  
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'table_reservations' AND column_name = 'child_count'
        ) THEN
          ALTER TABLE table_reservations ADD COLUMN child_count INTEGER DEFAULT 0;
        END IF;

        -- 添加兒童椅需求欄位
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'table_reservations' AND column_name = 'child_chair_needed'
        ) THEN
          ALTER TABLE table_reservations ADD COLUMN child_chair_needed BOOLEAN DEFAULT FALSE;
        END IF;

        -- 添加預約類型欄位
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'table_reservations' AND column_name = 'reservation_type'
        ) THEN
          ALTER TABLE table_reservations ADD COLUMN reservation_type VARCHAR(20) DEFAULT 'dining';
        END IF;

        -- 添加特殊需求欄位
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'table_reservations' AND column_name = 'special_requests'
        ) THEN
          ALTER TABLE table_reservations ADD COLUMN special_requests TEXT;
        END IF;
      END
      $$;

      -- 更新現有資料以符合新約束
      UPDATE table_reservations 
      SET 
        adult_count = CASE 
          WHEN party_size > 0 THEN party_size 
          ELSE 2 
        END,
        child_count = 0,
        child_chair_needed = FALSE,
        reservation_type = 'dining'
      WHERE adult_count IS NULL OR adult_count = 0;

      -- 創建索引
      CREATE INDEX IF NOT EXISTS idx_table_reservations_date ON table_reservations(reservation_date);
      CREATE INDEX IF NOT EXISTS idx_table_reservations_restaurant_id ON table_reservations(restaurant_id);
      CREATE INDEX IF NOT EXISTS idx_table_reservations_status ON table_reservations(status);
    