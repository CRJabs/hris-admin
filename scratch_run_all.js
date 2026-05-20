import { runBenefitsComputation } from './apps/web/src/utils/runBenefitsComputation.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'apps/web/.env.local') });

async function run() {
    const res = await runBenefitsComputation();
    console.log(res);
}

run();
