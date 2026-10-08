import { createHash } from 'node:crypto';
export function stableId(key) { const hex=createHash('sha256').update('makerspace:'+key).digest('hex'); return `${hex.slice(0,8)}-${hex.slice(8,12)}-4${hex.slice(13,16)}-8${hex.slice(17,20)}-${hex.slice(20,32)}`; }
export async function insertSeed(query, data) {
  for(const [key,label] of Object.entries({tool:'Tool',accessory:'Accessory',consumable:'Consumable',component:'Component',fixture:'Fixture',safety:'Safety',utility:'Utility'})) await query('INSERT INTO item_kinds(key,label) VALUES($1,$2) ON CONFLICT DO NOTHING',[key,label]);
  for(const t of data.types) await query('INSERT INTO item_types(id,key,label) VALUES($1,$2,$3) ON CONFLICT DO NOTHING',[stableId('type:'+t.key),t.key,t.label]);
  for(const [key,label,values] of [['category','Category',data.categories],['material','Material',data.facets.materials],['process','Process',data.facets.processes]]) {
    const facet=stableId('facet:'+key);
    await query('INSERT INTO facets(id,key,label) VALUES($1,$2,$3) ON CONFLICT DO NOTHING',[facet,key,label]);
    for(const [index,v] of values.entries()) await query('INSERT INTO facet_values(id,facet_id,key,label,description,sort_order) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING',[stableId('value:'+key+':'+v.key),facet,v.key,v.label,v.description??null,index]);
  }
  for(const i of data.items) {
    const inserted=await query('INSERT INTO catalog_items(id,slug,name,brand,model,kind,item_type_id,description,aliases,metadata) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT DO NOTHING RETURNING id',[i.id,i.slug,i.name,i.brand,i.model,i.kind,stableId('type:'+i.typeKey),i.description,i.aliases,JSON.stringify(i.metadata??{})]);
    // A repeated seed never overwrites or reclassifies maintained catalog records.
    if(!inserted.rows.length)continue;
    for(const [key,values] of [['category',i.categories],['material',i.materials],['process',i.processes]]) for(const v of values) await query('INSERT INTO item_facet_values(item_id,facet_value_id) VALUES($1,$2) ON CONFLICT DO NOTHING',[i.id,stableId('value:'+key+':'+v)]);
  }
  for(const r of data.relationships) await query('INSERT INTO compatibility(id,source_item_id,target_type_id,target_item_id,verification,notes) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING',[r.id,r.sourceItemId,r.targetTypeKey?stableId('type:'+r.targetTypeKey):null,r.targetItemId??null,r.verification,r.notes]);
}
