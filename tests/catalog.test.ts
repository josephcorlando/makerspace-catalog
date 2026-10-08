import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {insertSeed,stableId} from '../scripts/seed-core.mjs';
import {catalogQuery} from '../db/catalog-query.mjs';
import seed from '../db/seed-data.json';
import {searchItems,relatedItems,parseFilters,filterUrl} from '../lib/search';
import {Catalog,emptyFilters} from '../lib/types';
const data=seed as unknown as Catalog;
test('search finds aliases, tasks and combined intent; filters intersect',()=>{
 assert(searchItems(data,{...emptyFilters,q:'dremel'}).some(i=>i.typeKey==='rotary-tool'));
 assert(searchItems(data,{...emptyFilters,q:'allen wrench'}).every(i=>i.typeKey==='hex-key'));
 assert(searchItems(data,{...emptyFilters,q:'cut metal'}).some(i=>i.typeKey==='jigsaw'));
 const matches=searchItems(data,{...emptyFilters,category:'electronics',process:'soldering',kind:'tool'});
 assert(matches.length>=4);assert(matches.every(i=>i.kind==='tool'&&i.categories.includes('electronics')&&i.processes.includes('soldering')));
 assert.equal(searchItems(data,{...emptyFilters,q:'no such imaginary tool'}).length,0);
});
test('relationships resolve both directions without duplicate cards',()=>{
 const rotary=data.items.find(i=>i.typeKey==='rotary-tool')!;
 const accessories=relatedItems(data,rotary);assert.equal(accessories.length,1);assert.equal(accessories[0].item.typeKey,'rotary-accessory');
 assert.equal(accessories[0].relationship.verification,'unverified');
 assert(relatedItems(data,accessories[0].item).some(x=>x.item.id===rotary.id));
});
test('URL filters survive sharing and back navigation',()=>{
 const f={...emptyFilters,q:'cut metal',material:'metal',kind:'tool',view:true,sort:'name'};
 assert.deepEqual(parseFilters(new URL(filterUrl(f),'http://localhost').searchParams),f);
});
test('Postgres migration/import/query enforce integrity and preserve edits',async()=>{
 const db=new PGlite();
 try{
  await db.exec(await readFile(new URL('../db/migrations/001_catalog.sql',import.meta.url),'utf8'));
  await insertSeed((q:string,p:unknown[])=>db.query(q,p),seed);
  const {rows}=await db.query<{catalog:Catalog}>(catalogQuery);
  const catalog=rows[0].catalog;
  assert.equal(catalog.items.length,150);assert.equal(catalog.categories.length,8);
  assert.equal(catalog.items.filter(i=>i.brand==='WAGO').length,1);
  assert.equal(catalog.items.filter(i=>i.typeKey==='soldering-station').length,2);
  assert(!JSON.stringify(catalog).includes('sourceRows'));
  await db.query('UPDATE catalog_items SET description=$1 WHERE id=$2',['Maintained description',seed.items[0].id]);
  await insertSeed((q:string,p:unknown[])=>db.query(q,p),seed);
  const result=await db.query<{description:string}>('SELECT description FROM catalog_items WHERE id=$1',[seed.items[0].id]);assert.equal(result.rows[0].description,'Maintained description');
  assert.equal((await db.query('SELECT id FROM catalog_items')).rows.length,150);
  await assert.rejects(db.query('INSERT INTO compatibility(source_item_id,target_item_id,target_type_id) VALUES($1,$2,$3)',[seed.items[0].id,seed.items[1].id,stableId('type:rotary-tool')]));
  await assert.rejects(db.query('INSERT INTO compatibility(source_item_id,target_item_id) VALUES($1,$1)',[seed.items[0].id]));
  await assert.rejects(db.query('INSERT INTO item_facet_values(item_id,facet_value_id) VALUES($1,$2)',[seed.items[0].id,'00000000-0000-4000-8000-000000000000']));
  const first=stableId('type:rotary-tool'),second=stableId('type:jigsaw');
  await db.query('UPDATE item_types SET parent_id=$1 WHERE id=$2',[first,second]);
  await assert.rejects(db.query('UPDATE item_types SET parent_id=$1 WHERE id=$2',[second,first]));
  // Archiving a tool hides it without destroying history or presenting a false match.
  await db.query('UPDATE catalog_items SET archived_at=now() WHERE id=$1',[seed.items[0].id]);
  assert.equal((await db.query('SELECT id FROM catalog_public')).rows.length,149);
  assert.equal((await db.query('SELECT id FROM catalog_items')).rows.length,150);
 }finally{await db.close();}
});
