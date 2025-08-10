-- Migrated extend-reservation-for-walkin.sql (Batch3)
ALTER TABLE public.table_reservations 
ADD COLUMN IF NOT EXISTS customer_gender VARCHAR(10) CHECK (customer_gender IN ('male', 'female', 'other', NULL)),
ADD COLUMN IF NOT EXISTS customer_last_name VARCHAR(50),
ADD COLUMN IF NOT EXISTS is_walk_in BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS arrival_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reservation_type VARCHAR(20) DEFAULT 'advance' CHECK (reservation_type IN ('advance', 'same_day', 'walk_in'));
