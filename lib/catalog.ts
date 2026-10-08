import 'server-only';
import { Pool } from 'pg';
import { unstable_cache } from 'next/cache';
import { catalogQuery } from '../db/catalog-query.mjs';
import type { Catalog } from './types';
const globals=globalThis as unknown as { catalogPool?:Pool };
function pool() { return globals.catalogPool??=new Pool({connectionString:process.env.DATABASE_URL,max:2,idleTimeoutMillis:10000,connectionTimeoutMillis:10000,statement_timeout:10000}); }
const readPostgres=unstable_cache(async():Promise<Catalog>=>{
  const {rows}=await pool().query(catalogQuery);return rows[0].catalog;
},['makerspace-catalog-v1'],{revalidate:300,tags:['catalog']});
export async function getCatalog():Promise<{catalog:Catalog;demo:boolean}> {
  if(process.env.CATALOG_DEMO==='true' && process.env.VERCEL!=='1') {
    const data=(await import('../db/seed-data.json')).default;
    // Allowlist fields: the preview uses the same public shape as Postgres.
    const items=data.items.map(({id,slug,name,brand,model,kind,typeKey,description,aliases,categories,materials,processes})=>({id,slug,name,brand,model,kind,typeKey,description,aliases,categories,materials,processes}));
    return {catalog:{...data,items} as Catalog,demo:true};
  }
  if(!process.env.DATABASE_URL)throw Error('Catalog database is not configured.');
  return {catalog:await readPostgres(),demo:false};
}
