-- Migrated reservation-database-extension.sql (Batch3)
ALTER TABLE table_reservations ADD COLUMN IF NOT EXISTS adult_count INTEGER DEFAULT 0;
ALTER TABLE table_reservations ADD COLUMN IF NOT EXISTS child_count INTEGER DEFAULT 0;
ALTER TABLE table_reservations ADD COLUMN IF NOT EXISTS child_chair_needed BOOLEAN DEFAULT false;
ALTER TABLE table_reservations ADD COLUMN IF NOT EXISTS reservation_notes TEXT;
UPDATE table_reservations SET adult_count = party_size, child_count = 0, child_chair_needed = false WHERE adult_count = 0 AND child_count = 0 AND party_size > 0;
ALTER TABLE table_reservations ADD CONSTRAINT check_party_size_consistency CHECK (party_size = adult_count + child_count);
