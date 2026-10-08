import pg from 'pg';
import {readFile} from 'node:fs/promises';
import {insertSeed} from './seed-core.mjs';
if(!process.env.DATABASE_URL)throw Error('Set DATABASE_URL in .env.local before importing.');
const data=JSON.parse(await readFile(new URL('../db/seed-data.json',import.meta.url),'utf8'));
const client=new pg.Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:10000});
try {
 await client.connect(); await client.query('BEGIN');await client.query('SELECT pg_advisory_xact_lock(741905)');
 await insertSeed((q,p)=>client.query(q,p),data); await client.query('COMMIT'); console.log('Imported inventory. Existing records preserved.');
} catch(error) { await client.query('ROLLBACK').catch(()=>{}); console.error('Import failed. Changes rolled back.');process.exitCode=1; } finally { await client.end(); }
