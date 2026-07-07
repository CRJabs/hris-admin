-- ============================================================
-- Migration: fn_assign_default_leave_credits + trigger
-- Run this in your Supabase SQL Editor (Database > SQL Editor)
-- ============================================================
--
-- This creates a PostgreSQL trigger function that automatically
-- inserts default leave credits whenever a new employee row
-- is inserted into the `employees` table.
-- ============================================================

CREATE OR REPLACE FUNCTION fn_assign_default_leave_credits()
RETURNS TRIGGER AS $$
DECLARE
  v_classification TEXT;
BEGIN
  v_classification := NEW.employment_classification;

  -- Teaching employees
  IF v_classification = 'Teaching' THEN
    INSERT INTO leave_credits (employee_id, leave_type, total_credits, used_credits, is_commutable, updated_at)
    VALUES
      (NEW.id, 'Vacation',    7,  0, true,  NOW()),
      (NEW.id, 'Family',      4,  0, false, NOW()),
      (NEW.id, 'Bereavement', 3,  0, false, NOW()),
      (NEW.id, 'Sick',        15, 0, true,  NOW()),
      (NEW.id, 'Force',       5,  0, true,  NOW()),
      (NEW.id, 'Force',       5,  0, false, NOW());
  ELSE
    -- Non-Teaching (default)
    INSERT INTO leave_credits (employee_id, leave_type, total_credits, used_credits, is_commutable, updated_at)
    VALUES
      (NEW.id, 'Vacation',    10, 0, true,  NOW()),
      (NEW.id, 'Vacation',    5,  0, false, NOW()),
      (NEW.id, 'Family',      4,  0, false, NOW()),
      (NEW.id, 'Bereavement', 3,  0, false, NOW()),
      (NEW.id, 'Sick',        15, 0, true,  NOW()),
      (NEW.id, 'Force',       5,  0, true,  NOW()),
      (NEW.id, 'Force',       5,  0, false, NOW());
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the trigger to avoid conflicts on re-run
DROP TRIGGER IF EXISTS tr_on_employee_created ON employees;

CREATE TRIGGER tr_on_employee_created
  AFTER INSERT ON employees
  FOR EACH ROW
  EXECUTE FUNCTION fn_assign_default_leave_credits();

-- ============================================================
-- Verification Query
-- After running, insert a test employee and check:
--   SELECT * FROM leave_credits WHERE employee_id = '<new_id>';
-- ============================================================
