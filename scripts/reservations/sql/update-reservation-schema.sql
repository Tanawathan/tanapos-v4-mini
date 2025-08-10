-- Migrated update-reservation-schema.sql (Batch3)
ALTER TABLE table_reservations ADD COLUMN IF NOT EXISTS adult_count INTEGER DEFAULT 0;
ALTER TABLE table_reservations ADD COLUMN IF NOT EXISTS child_count INTEGER DEFAULT 0;
ALTER TABLE table_reservations ADD COLUMN IF NOT EXISTS child_chair_needed BOOLEAN DEFAULT FALSE;
ALTER TABLE table_reservations ADD COLUMN IF NOT EXISTS reservation_type VARCHAR(20) DEFAULT 'dining';
ALTER TABLE table_reservations ADD COLUMN IF NOT EXISTS special_requests TEXT;
