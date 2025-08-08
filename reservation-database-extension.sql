-- TanaPOS v4 AI 預約系統資料庫擴展
-- 新增支援成人/兒童區分的欄位

-- 1. 新增成人人數欄位
ALTER TABLE table_reservations ADD COLUMN IF NOT EXISTS adult_count INTEGER DEFAULT 0;

-- 2. 新增兒童人數欄位  
ALTER TABLE table_reservations ADD COLUMN IF NOT EXISTS child_count INTEGER DEFAULT 0;

-- 3. 新增兒童椅需求欄位
ALTER TABLE table_reservations ADD COLUMN IF NOT EXISTS child_chair_needed BOOLEAN DEFAULT false;

-- 4. 新增預約備註欄位（如果不存在）
ALTER TABLE table_reservations ADD COLUMN IF NOT EXISTS reservation_notes TEXT;

-- 5. 更新現有資料的總人數邏輯
-- 如果已有 party_size 但 adult_count 和 child_count 都是 0，則假設全部為成人
UPDATE table_reservations 
SET adult_count = party_size, 
    child_count = 0,
    child_chair_needed = false
WHERE adult_count = 0 AND child_count = 0 AND party_size > 0;

-- 6. 建立檢查約束，確保總人數一致性
ALTER TABLE table_reservations 
ADD CONSTRAINT check_party_size_consistency 
CHECK (party_size = adult_count + child_count);

-- 7. 建立預約容量檢查函數
CREATE OR REPLACE FUNCTION check_reservation_capacity(
    restaurant_uuid UUID,
    reservation_datetime TIMESTAMP WITH TIME ZONE,
    party_size_input INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    time_slot_start TIMESTAMP WITH TIME ZONE;
    time_slot_end TIMESTAMP WITH TIME ZONE;
    current_capacity INTEGER;
    max_capacity INTEGER DEFAULT 8;
BEGIN
    -- 計算 30 分鐘時段
    time_slot_start := date_trunc('minute', reservation_datetime);
    time_slot_start := time_slot_start - (EXTRACT(MINUTE FROM time_slot_start)::INTEGER % 30) * INTERVAL '1 minute';
    time_slot_end := time_slot_start + INTERVAL '30 minutes';
    
    -- 計算該時段現有預約人數
    SELECT COALESCE(SUM(party_size), 0) INTO current_capacity
    FROM table_reservations
    WHERE restaurant_id = restaurant_uuid
    AND status NOT IN ('cancelled', 'no_show', 'completed')
    AND reservation_time >= time_slot_start
    AND reservation_time < time_slot_end;
    
    -- 檢查是否超過容量限制
    RETURN (current_capacity + party_size_input) <= max_capacity;
END;
$$ LANGUAGE plpgsql;

-- 8. 建立取得可用時段函數
CREATE OR REPLACE FUNCTION get_available_time_slots(
    restaurant_uuid UUID,
    target_date DATE,
    party_size_input INTEGER
) RETURNS TABLE(time_slot TIMESTAMP WITH TIME ZONE, available_capacity INTEGER) AS $$
DECLARE
    business_hours JSONB;
    open_time TIME;
    close_time TIME;
    current_time TIMESTAMP WITH TIME ZONE;
    slot_capacity INTEGER;
BEGIN
    -- 取得營業時間
    SELECT r.business_hours INTO business_hours
    FROM restaurants r 
    WHERE r.id = restaurant_uuid;
    
    -- 取得當天營業時間
    CASE EXTRACT(DOW FROM target_date)
        WHEN 0 THEN -- Sunday
            open_time := (business_hours->'sunday'->>'open')::TIME;
            close_time := (business_hours->'sunday'->>'close')::TIME;
        WHEN 1 THEN -- Monday  
            open_time := (business_hours->'monday'->>'open')::TIME;
            close_time := (business_hours->'monday'->>'close')::TIME;
        WHEN 2 THEN -- Tuesday
            open_time := (business_hours->'tuesday'->>'open')::TIME;
            close_time := (business_hours->'tuesday'->>'close')::TIME;
        WHEN 3 THEN -- Wednesday
            open_time := (business_hours->'wednesday'->>'open')::TIME;
            close_time := (business_hours->'wednesday'->>'close')::TIME;
        WHEN 4 THEN -- Thursday
            open_time := (business_hours->'thursday'->>'open')::TIME;
            close_time := (business_hours->'thursday'->>'close')::TIME;
        WHEN 5 THEN -- Friday
            open_time := (business_hours->'friday'->>'open')::TIME;
            close_time := (business_hours->'friday'->>'close')::TIME;
        WHEN 6 THEN -- Saturday
            open_time := (business_hours->'saturday'->>'open')::TIME;
            close_time := (business_hours->'saturday'->>'close')::TIME;
    END CASE;
    
    -- 如果沒有營業時間設定，返回空結果
    IF open_time IS NULL OR close_time IS NULL THEN
        RETURN;
    END IF;
    
    -- 生成 30 分鐘間隔的時段
    current_time := target_date + open_time;
    
    WHILE current_time + INTERVAL '30 minutes' <= target_date + close_time LOOP
        -- 計算該時段可用容量
        SELECT 8 - COALESCE(SUM(party_size), 0) INTO slot_capacity
        FROM table_reservations
        WHERE restaurant_id = restaurant_uuid
        AND status NOT IN ('cancelled', 'no_show', 'completed')
        AND reservation_time >= current_time
        AND reservation_time < current_time + INTERVAL '30 minutes';
        
        -- 如果可用容量足夠，返回該時段
        IF slot_capacity >= party_size_input THEN
            time_slot := current_time;
            available_capacity := slot_capacity;
            RETURN NEXT;
        END IF;
        
        current_time := current_time + INTERVAL '30 minutes';
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;
