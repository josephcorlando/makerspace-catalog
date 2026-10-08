export type Kind = 'tool' | 'accessory' | 'consumable' | 'component' | 'fixture' | 'safety' | 'utility';
export interface Option { key: string; label: string; description?: string }
export interface Item {
  id: string; slug: string; name: string; brand: string | null; model: string | null;
  kind: Kind; typeKey: string; description: string | null; aliases: string[];
  materials: string[]; processes: string[]; categories: string[];
}
export interface Relationship {
  id: string; sourceItemId: string; targetTypeKey?: string | null; targetItemId?: string | null;
  verification: 'verified' | 'unverified'; notes: string | null;
}
export interface Catalog { items: Item[]; categories: Option[]; types: Option[];
  facets: { materials: Option[]; processes: Option[] }; relationships: Relationship[] }
export interface Filters { q: string; category: string; material: string; process: string; kind: string; view: boolean; sort: string }
export const kinds: Option[] = [
  {key:'tool',label:'Tools'}, {key:'accessory',label:'Accessories'}, {key:'consumable',label:'Consumables'},
  {key:'component',label:'Components'}, {key:'fixture',label:'Fixtures'}, {key:'safety',label:'Safety'}, {key:'utility',label:'Utilities'},
];
export const emptyFilters: Filters = { q:'', category:'', material:'', process:'', kind:'', view:false, sort:'relevance' };
export function label(options: Option[], key: string) { return options.find(x=>x.key===key)?.label ?? key; }
export function itemTitle(item: Item) { return [item.brand,item.model,item.name].filter(Boolean).join(' · '); }
