-- Add exit_verification column to receipts table
-- This column tracks whether a receipt has been verified at the exit gate
-- false = not yet verified (default when payment completes)
-- true = verified by guard (bill cannot be used again)

ALTER TABLE receipts 
ADD COLUMN exit_verification BOOLEAN DEFAULT false NOT NULL;

-- Update existing records to have exit_verification = false
UPDATE receipts 
SET exit_verification = false 
WHERE exit_verification IS NULL;

