import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'apps/web/.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY; 
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: orgUnits } = await supabase.from('org_units').select('*');
  const { data: emps } = await supabase.from('employees').select('*');
  
  // Unique values of classification_ii and classification_iii
  const classII = new Set(emps.map(e => e.classification_ii).filter(Boolean));
  console.log("Classification II values in DB:", Array.from(classII));
  
  const classIII = new Set(emps.map(e => e.classification_iii).filter(Boolean));
  console.log("Classification III values in DB:", Array.from(classIII));

  // Let's print out the exact positions and routing helper
  const findAncestors = (unitId) => {
    const list = [];
    let curr = orgUnits.find(u => u.id === unitId);
    while (curr) {
      list.push(curr);
      if (curr.parent_id) {
        curr = orgUnits.find(u => u.id === curr.parent_id);
      } else {
        break;
      }
    }
    return list;
  };

  emps.slice(0, 15).forEach(e => {
    const ancestors = findAncestors(e.org_unit_id);
    const ancestorNames = ancestors.map(a => a.name).join(' -> ');
    
    // Check years of service
    let years = 0;
    if (e.date_hired) {
      const hireDate = new Date(e.date_hired);
      const diffMs = Date.now() - hireDate.getTime();
      years = diffMs / (1000 * 60 * 60 * 24 * 365.25);
    }
    
    console.log(`- ${e.first_name} ${e.last_name}: Pos: ${e.position}, Class I: ${e.employment_classification}, Class II: ${e.classification_ii}, Hired: ${e.date_hired} (${years.toFixed(1)} yrs), Path: [${ancestorNames}]`);
  });
}

check();
