import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Fetches the live list of all departments from both the Academic and
 * Non-Academic org trees, replacing the static DEPARTMENTS constant.
 *
 * @returns {{
 *   departments: Array<{id: string, name: string, logo_url: string|null, type: 'academic'|'non-academic'}>,
 *   academicDepts: Array,
 *   nonAcademicDepts: Array,
 *   isLoading: boolean
 * }}
 */
export function useOrgDepartments() {
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDepartments() {
      try {
        // Fetch all org units in one call
        const { data: allUnits, error } = await supabase
          .from('org_units')
          .select('id, name, parent_id, logo_url');

        if (error) throw error;

        // Find the two root hub nodes
        const academicRoot = allUnits.find(u =>
          u.name?.toLowerCase().includes('academic departments') && !u.parent_id
        );
        const nonAcademicRoot = allUnits.find(u =>
          u.name?.toLowerCase().includes('non-academic departments') && !u.parent_id
        );

        // Get their direct children
        const academicDepts = academicRoot
          ? allUnits
              .filter(u => u.parent_id === academicRoot.id)
              .map(u => ({ ...u, type: 'academic' }))
          : [];

        const nonAcademicDepts = nonAcademicRoot
          ? allUnits
              .filter(u => u.parent_id === nonAcademicRoot.id)
              .map(u => ({ ...u, type: 'non-academic' }))
          : [];

        setDepartments([...academicDepts, ...nonAcademicDepts]);
      } catch (err) {
        console.error('useOrgDepartments: Failed to fetch departments', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDepartments();
  }, []);

  const academicDepts = departments.filter(d => d.type === 'academic');
  const nonAcademicDepts = departments.filter(d => d.type === 'non-academic');

  return { departments, academicDepts, nonAcademicDepts, isLoading };
}
