-- ============================================================
-- Migration: resolve_commutation_approvers RPC
-- Run this in your Supabase SQL Editor (Database > SQL Editor)
-- ============================================================
--
-- This creates a PostgreSQL function that resolves the commutation
-- approval chain for a given employee using a recursive CTE
-- over the org_units table.
--
-- Returns: ra_id, noted_by_id, approved_by_id, condition_name
-- ============================================================

-- Drop first to allow return type change (CREATE OR REPLACE cannot change return type)
DROP FUNCTION IF EXISTS resolve_commutation_approvers(UUID);

CREATE OR REPLACE FUNCTION resolve_commutation_approvers(emp_id UUID)
RETURNS JSON AS $$
DECLARE
  v_employee        RECORD;
  v_unit_id         UUID;
  v_president_unit  RECORD;
  v_vp_admin_unit   RECORD;
  v_vp_finance_unit RECORD;
  v_vp_academic_unit RECORD;
  v_president_id    UUID;
  v_vp_admin_id     UUID;
  v_vp_finance_id   UUID;
  v_vp_academic_id  UUID;
  v_dean_emp_id     UUID;
  v_years_service   NUMERIC;
  v_is_less_than_3  BOOLEAN;
  v_is_teaching     BOOLEAN;
  v_is_managerial   BOOLEAN;
  v_has_teaching_load BOOLEAN;
  v_is_under_vp_admin BOOLEAN;
  v_is_direct_under_president BOOLEAN;
  v_ra_id           UUID := NULL;
  v_noted_by_id     UUID := NULL;
  v_approved_by_id  UUID := NULL;
  v_condition_name  TEXT := '';
  v_ancestor_ids    UUID[];
BEGIN
  -- 1. Load the target employee
  SELECT * INTO v_employee FROM employees WHERE id = emp_id;
  IF NOT FOUND THEN RETURN NULL; END IF;

  -- 2. Resolve org unit
  v_unit_id := v_employee.org_unit_id;
  IF v_unit_id IS NULL AND v_employee.department IS NOT NULL THEN
    SELECT id INTO v_unit_id FROM org_units
    WHERE LOWER(name) = LOWER(v_employee.department)
    LIMIT 1;
  END IF;

  -- 3. Build ancestor chain using recursive CTE
  WITH RECURSIVE ancestors AS (
    SELECT id, parent_id, head_id, name FROM org_units WHERE id = v_unit_id
    UNION ALL
    SELECT ou.id, ou.parent_id, ou.head_id, ou.name
    FROM org_units ou
    INNER JOIN ancestors a ON ou.id = a.parent_id
  )
  SELECT ARRAY_AGG(id ORDER BY id) INTO v_ancestor_ids FROM ancestors;

  -- 4. Resolve executive units
  SELECT * INTO v_president_unit FROM org_units WHERE parent_id IS NULL LIMIT 1;
  v_president_id := v_president_unit.head_id;

  SELECT * INTO v_vp_admin_unit FROM org_units
    WHERE LOWER(name) LIKE '%administration%' AND parent_id = v_president_unit.id LIMIT 1;
  v_vp_admin_id := v_vp_admin_unit.head_id;

  SELECT * INTO v_vp_finance_unit FROM org_units
    WHERE LOWER(name) LIKE '%finance%' AND parent_id = v_president_unit.id LIMIT 1;
  v_vp_finance_id := v_vp_finance_unit.head_id;

  SELECT * INTO v_vp_academic_unit FROM org_units
    WHERE LOWER(name) LIKE '%academic%' AND parent_id = v_president_unit.id LIMIT 1;
  v_vp_academic_id := v_vp_academic_unit.head_id;

  -- 5. Resolve Dean/Office Head (first non-executive ancestor head)
  SELECT ou.head_id INTO v_dean_emp_id
  FROM org_units ou
  WHERE ou.id = ANY(v_ancestor_ids)
    AND ou.id NOT IN (
      v_president_unit.id,
      COALESCE(v_vp_admin_unit.id, '00000000-0000-0000-0000-000000000000'::UUID),
      COALESCE(v_vp_finance_unit.id, '00000000-0000-0000-0000-000000000000'::UUID),
      COALESCE(v_vp_academic_unit.id, '00000000-0000-0000-0000-000000000000'::UUID)
    )
    AND ou.head_id IS NOT NULL
    AND ou.head_id <> emp_id
  LIMIT 1;

  -- 6. Compute metrics
  v_years_service := EXTRACT(EPOCH FROM (NOW() - v_employee.date_hired)) / (365.25 * 86400);
  v_is_less_than_3 := v_years_service < 3;
  v_is_teaching := LOWER(v_employee.employment_classification) = 'teaching';
  v_is_managerial := LOWER(v_employee.position) LIKE '%manager%' OR LOWER(v_employee.position) LIKE '%supervisor%';
  v_is_under_vp_admin := (v_vp_admin_unit.id = ANY(v_ancestor_ids));
  v_is_direct_under_president := (
    v_president_unit.id = ANY(v_ancestor_ids)
    AND NOT v_is_under_vp_admin
    AND NOT (v_vp_academic_unit.id = ANY(v_ancestor_ids))
    AND NOT (v_vp_finance_unit.id = ANY(v_ancestor_ids))
  );

  SELECT EXISTS (
    SELECT 1 FROM employee_semesters
    WHERE employee_id = emp_id AND is_active = true AND teaching_load > 0
  ) INTO v_has_teaching_load;

  -- 7. Apply the 18 conditions
  v_approved_by_id := v_vp_admin_id; -- default

  IF emp_id = v_president_id OR LOWER(v_employee.position) LIKE '%university president%' THEN
    v_condition_name := 'University President';
    v_approved_by_id := v_president_id;

  ELSIF emp_id = v_vp_finance_id OR emp_id = v_vp_academic_id THEN
    v_condition_name := 'VP for Finance / VP for Academic Affairs';
    v_noted_by_id    := v_vp_admin_id;
    v_approved_by_id := v_president_id;

  ELSIF emp_id = v_vp_admin_id THEN
    v_condition_name := 'VP for Administration';
    v_approved_by_id := v_president_id;

  ELSIF v_is_managerial AND v_is_under_vp_admin THEN
    v_condition_name := 'Managerial/Supervisory under VP for Admin ' || (CASE WHEN v_has_teaching_load THEN 'WITH' ELSE 'WITHOUT' END) || ' Teaching Load';
    v_approved_by_id := v_vp_admin_id;

  ELSIF v_is_managerial AND v_is_direct_under_president THEN
    v_condition_name := 'Managerial/Supervisory under University President ' || (CASE WHEN v_has_teaching_load THEN 'WITH' ELSE 'WITHOUT' END) || ' Teaching Load';
    v_noted_by_id    := v_vp_admin_id;
    v_approved_by_id := v_president_id;

  ELSIF v_is_managerial THEN
    v_condition_name := 'Managerial/Supervisory under Dean/Office Head ' || (CASE WHEN v_has_teaching_load THEN 'WITH' ELSE 'WITHOUT' END) || ' Teaching Load';
    v_ra_id          := v_dean_emp_id;
    v_approved_by_id := v_vp_admin_id;

  ELSIF NOT v_is_teaching AND v_is_direct_under_president AND v_dean_emp_id IS NULL THEN
    v_condition_name := 'Non-Teaching under President''s Office (' || (CASE WHEN v_is_less_than_3 THEN 'Less than' ELSE 'More than' END) || ' 3 Years)';
    v_noted_by_id    := v_vp_admin_id;
    v_approved_by_id := v_president_id;

  ELSIF NOT v_is_teaching AND v_is_direct_under_president AND v_dean_emp_id IS NOT NULL THEN
    v_condition_name := 'Non-Teaching under President''s Office and Dept Head (' || (CASE WHEN v_is_less_than_3 THEN 'Less than' ELSE 'More than' END) || ' 3 Years) ' || (CASE WHEN v_has_teaching_load THEN 'WITH' ELSE 'WITHOUT' END) || ' Teaching Load';
    v_ra_id          := v_dean_emp_id;
    v_noted_by_id    := v_vp_admin_id;
    v_approved_by_id := v_president_id;

  ELSIF NOT v_is_teaching THEN
    v_condition_name := 'Institutional Non-Teaching (' || (CASE WHEN v_is_less_than_3 THEN 'Less than' ELSE 'More than' END) || ' 3 Years) ' || (CASE WHEN v_has_teaching_load THEN 'WITH' ELSE 'WITHOUT' END) || ' Teaching Load';
    v_ra_id          := v_dean_emp_id;
    v_approved_by_id := v_vp_admin_id;

  ELSE
    v_condition_name := 'Teaching Employee';
    v_ra_id          := v_dean_emp_id;
    v_approved_by_id := v_vp_admin_id;
  END IF;

  RETURN JSON_BUILD_OBJECT(
    'ra_id',          v_ra_id,
    'noted_by_id',    v_noted_by_id,
    'approved_by_id', v_approved_by_id,
    'condition_name', v_condition_name
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Test:
--   SELECT resolve_commutation_approvers('<employee_uuid>');
-- ============================================================
