-- 確保 tables 表有基本資料
-- 檢查是否存在桌台資料，如果沒有則創建

DO $$
DECLARE
    table_count INTEGER;
    restaurant_uuid UUID;
BEGIN
    -- 檢查桌台數量
    SELECT COUNT(*) INTO table_count FROM tables;
    
    -- 如果沒有桌台資料，則創建
    IF table_count = 0 THEN
        RAISE NOTICE '沒有找到桌台資料，正在創建基本桌台...';
        
        -- 獲取第一個餐廳 ID，如果沒有則創建
        SELECT id INTO restaurant_uuid FROM restaurants LIMIT 1;
        
        IF restaurant_uuid IS NULL THEN
            -- 創建預設餐廳
            INSERT INTO restaurants (id, name, address, phone)
            VALUES (
                gen_random_uuid(),
                'TanaPOS 示範餐廳',
                '台北市信義區信義路五段7號',
                '02-1234-5678'
            )
            RETURNING id INTO restaurant_uuid;
            RAISE NOTICE '已創建預設餐廳: %', restaurant_uuid;
        END IF;
        
        -- 創建基本桌台資料
        INSERT INTO tables (restaurant_id, table_number, table_name, capacity, location, status) VALUES
        (restaurant_uuid, 1, '桌號 1', 4, '一樓大廳', 'available'),
        (restaurant_uuid, 2, '桌號 2', 4, '一樓大廳', 'available'),
        (restaurant_uuid, 3, '桌號 3', 6, '一樓大廳', 'available'),
        (restaurant_uuid, 4, '桌號 4', 4, '一樓大廳', 'available'),
        (restaurant_uuid, 5, '桌號 5', 2, '一樓大廳', 'available'),
        (restaurant_uuid, 6, '桌號 6', 4, '二樓包廂區', 'available'),
        (restaurant_uuid, 7, '桌號 7', 6, '二樓包廂區', 'available'),
        (restaurant_uuid, 8, '桌號 8', 4, '二樓包廂區', 'available'),
        (restaurant_uuid, 9, '桌號 9', 8, '二樓VIP包廂', 'available'),
        (restaurant_uuid, 10, '桌號 10', 4, '露台區', 'available');
        
        RAISE NOTICE '已創建 10 個基本桌台';
    ELSE
        RAISE NOTICE '找到 % 個桌台，無需創建', table_count;
    END IF;
END
$$;
