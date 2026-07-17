import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Fetches the live list of all departments from Executive Offices,
 * Academic (Institutional), and Non-Academic (Non-Institutional) org trees.
 */
export function useOrgDepartments() {
  const [departments, setDepartments] = useState([]);
  const [executiveOffices, setExecutiveOffices] = useState([]);
  const [academicDepts, setAcademicDepts] = useState([]);
  const [nonAcademicDepts, setNonAcademicDepts] = useState([]);
  const [allUnits, setAllUnits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDepartments() {
      try {
        const { data: allUnitsData, error } = await supabase
          .from('org_units')
          .select('id, name, parent_id, logo_url, head_id, heads');

        if (error) throw error;

        const academicRoot = allUnitsData.find(u =>
          u.name?.toLowerCase().includes('academic departments')
        );
        const nonAcademicRoot = allUnitsData.find(u =>
          u.name?.toLowerCase().includes('non-academic departments')
        );

        const getDescendants = (rootId, type) => {
          if (!rootId) return [];
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

        const instDepts = academicRoot ? getDescendants(academicRoot.id, 'academic') : [];
        const nonInstDepts = nonAcademicRoot ? getDescendants(nonAcademicRoot.id, 'non-academic') : [];

        const isHubOrRoot = (unit) => {
          const name = unit.name?.toLowerCase() || '';
          return name.includes('academic departments') || name.includes('non-academic departments');
        };

        const deptIds = new Set([...instDepts.map(d => d.id), ...nonInstDepts.map(d => d.id)]);
        const execs = allUnitsData.filter(u => !deptIds.has(u.id) && !isHubOrRoot(u)).map(u => ({ ...u, type: 'executive' }));

        setExecutiveOffices(execs);
        setAcademicDepts(instDepts);
        setNonAcademicDepts(nonInstDepts);
        setDepartments([...execs, ...instDepts, ...nonInstDepts]);
        setAllUnits(allUnitsData);
      } catch (err) {
        console.error('useOrgDepartments: Failed to fetch departments', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDepartments();
  }, []);

  return { 
    departments, 
    executiveOffices, 
    academicDepts, 
    nonAcademicDepts, 
    allUnits, 
    isLoading 
  };
}
