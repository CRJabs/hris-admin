-- Migration: Fix employee_semesters RLS policies
-- The table previously only had a SELECT policy for authenticated users,
-- blocking admins from INSERT, UPDATE, and DELETE operations.

-- Remove the overly restrictive read-only policy for authenticated users
DROP POLICY IF EXISTS "Allow read for authenticated users" ON employee_semesters;

-- Full access for admin users (matches pattern used by other tables in the schema)
CREATE POLICY "employee_semesters_admin_all"
ON employee_semesters
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'admin'
  )
);

-- Read-only access for employees to view their own semester records
CREATE POLICY "employee_semesters_employee_read_own"
ON employee_semesters
FOR SELECT
TO authenticated
USING (
  employee_id IN (
    SELECT employees.id FROM employees
    WHERE employees.user_id = auth.uid()
  )
);

-- Fix leave_transactions missing UPDATE and DELETE policies for admins
DROP POLICY IF EXISTS "leave_transactions_admin_delete" ON leave_transactions;
DROP POLICY IF EXISTS "leave_transactions_admin_update" ON leave_transactions;

CREATE POLICY "leave_transactions_admin_delete"
ON leave_transactions FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "leave_transactions_admin_update"
ON leave_transactions FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Remove redundant duplicate INSERT policies on admin_activity_log
DROP POLICY IF EXISTS "Authenticated users can insert activity logs" ON admin_activity_log;
DROP POLICY IF EXISTS "Employees can insert activity logs" ON admin_activity_log;

