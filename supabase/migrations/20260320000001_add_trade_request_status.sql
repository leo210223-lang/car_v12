-- Add review status for trade requests
ALTER TABLE public.trade_requests
ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'pending';

-- Backfill existing rows to approved to avoid hiding historical data
UPDATE public.trade_requests
SET status = 'approved'
WHERE status IS NULL OR status = 'pending';

-- Add/refresh status constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'trade_requests'
      AND constraint_name = 'trade_requests_status_check'
  ) THEN
    ALTER TABLE public.trade_requests DROP CONSTRAINT trade_requests_status_check;
  END IF;
END $$;

ALTER TABLE public.trade_requests
ADD CONSTRAINT trade_requests_status_check
CHECK (status IN ('pending', 'approved', 'rejected'));

CREATE INDEX IF NOT EXISTS idx_trade_requests_status
ON public.trade_requests(status);
