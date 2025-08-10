-- Migrated fix-reservation-immediate.sql (Batch3)
ALTER TABLE public.table_reservations ADD COLUMN IF NOT EXISTS reservation_type VARCHAR(50) DEFAULT 'dining';
ALTER TABLE public.table_reservations ADD COLUMN IF NOT EXISTS adult_count INTEGER DEFAULT 0;
ALTER TABLE public.table_reservations ADD COLUMN IF NOT EXISTS child_count INTEGER DEFAULT 0;
ALTER TABLE public.table_reservations ADD COLUMN IF NOT EXISTS child_chair_needed BOOLEAN DEFAULT FALSE;
