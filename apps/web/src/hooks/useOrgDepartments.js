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
  const [allUnits, setAllUnits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDepartments() {
      try {
        // Fetch all org units in one call
        const { data: allUnitsData, error } = await supabase
          .from('org_units')
          .select('id, name, parent_id, logo_url, head_id, heads');

        if (error) throw error;

        // Find the two root hub nodes
        const academicRoot = allUnitsData.find(u =>
          u.name?.toLowerCase().includes('academic departments') && !u.parent_id
        );
        const nonAcademicRoot = allUnitsData.find(u =>
          u.name?.toLowerCase().includes('non-academic departments') && !u.parent_id
        );

        // Helper to get all descendants recursively/BFS
        const getDescendants = (rootId, type) => {
          const result = [];
          const queue = [rootId];
          while (queue.length > 0) {
            const currentId = queue.shift();
            const children = allUnitsData.filter(u => u.parent_id === currentId);
            for (const child of children) {
              result.push({ ...child, type });
              queue.push(child.id);
            }
          }
          return result;
        };

        // Get all descendant departments
        const academicDepts = academicRoot
          ? getDescendants(academicRoot.id, 'academic')
          : [];

        const nonAcademicDepts = nonAcademicRoot
          ? getDescendants(nonAcademicRoot.id, 'non-academic')
          : [];

        setDepartments([...academicDepts, ...nonAcademicDepts]);
        setAllUnits(allUnitsData);
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

  return { departments, academicDepts, nonAcademicDepts, allUnits, isLoading };
}
