import { Catalog, Filters, Item, Relationship, emptyFilters, label } from './types';
export function normalize(s: string) { return s.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim(); }
const synonyms: Record<string,string> = { cut:'cutting', drill:'drilling', solder:'soldering', sand:'sanding', grind:'grinding', sew:'sewing', measure:'measuring', polish:'polishing', engrave:'engraving', metals:'metal', wooden:'wood', plastics:'plastic' };
const stop = new Set(['a','an','the','with','for','on','to','i','need','can','how','do','of']);
export function searchItems(catalog:Catalog, filters:Filters): Item[] {
  const tokens=normalize(filters.q).split(' ').filter(t=>t && !stop.has(t));
  const scored=catalog.items.filter(i=>(!filters.category || i.categories.includes(filters.category)) && (!filters.material || i.materials.includes(filters.material)) && (!filters.process || i.processes.includes(filters.process)) && (!filters.kind || i.kind===filters.kind)).map(i=>{
    const identity=normalize([i.name,i.brand,i.model,...i.aliases,label(catalog.types,i.typeKey)].filter(Boolean).join(' '));
    const facets=normalize([...i.materials.map(x=>label(catalog.facets.materials,x)),...i.processes.map(x=>label(catalog.facets.processes,x)),...i.categories.map(x=>label(catalog.categories,x)),i.kind].join(' '));
    let score=0;
    for(const token of tokens) {
      const variants=[token,synonyms[token]].filter(Boolean);
      if(variants.some(v=>identity.includes(v))) score+=4;
      else if(variants.some(v=>facets.includes(v))) score+=1;
      else return {item:i,score:-1};
    }
    if(tokens.length && identity.includes(normalize(filters.q))) score+=8;
    return {item:i,score};
  }).filter(x=>x.score>=0);
  scored.sort((a,b)=>filters.sort==='name' ? a.item.name.localeCompare(b.item.name)||String(a.item.brand).localeCompare(String(b.item.brand)) : b.score-a.score||a.item.name.localeCompare(b.item.name)||String(a.item.brand).localeCompare(String(b.item.brand)));
  return scored.map(x=>x.item);
}
export function relatedItems(catalog:Catalog, item:Item): {item:Item; relationship:Relationship; direction:'accessory'|'tool'}[] {
  const found=new Map<string,{item:Item;relationship:Relationship;direction:'accessory'|'tool'}>();
  for(const r of catalog.relationships) {
    if(r.targetItemId===item.id || r.targetTypeKey===item.typeKey) {
      const accessory=catalog.items.find(i=>i.id===r.sourceItemId);
      if(accessory) found.set(accessory.id,{item:accessory,relationship:r,direction:'accessory'});
    }
    if(r.sourceItemId===item.id) for(const tool of catalog.items.filter(i=>r.targetItemId===i.id || r.targetTypeKey===i.typeKey)) found.set(tool.id,{item:tool,relationship:r,direction:'tool'});
  }
  return [...found.values()];
}
export function parseFilters(params:URLSearchParams):Filters {
  return {...emptyFilters,q:(params.get('q')??'').slice(0,200),category:params.get('category')??'',material:params.get('material')??'',process:params.get('process')??'',kind:params.get('kind')??'',view:params.get('view')==='all',sort:params.get('sort')==='name'?'name':'relevance'};
}
export function filterUrl(f:Filters) {
  const params=new URLSearchParams();
  for(const key of ['q','category','material','process','kind'] as const) if(f[key]) params.set(key,f[key]);
  if(f.view)params.set('view','all'); if(f.sort==='name')params.set('sort','name');
  return '/makerspace'+(params.size?'?'+params.toString():'');
}
