import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import Link from 'next/link';
import {Wrench,Package,FolderOpen} from 'lucide-react';
import {getCatalog} from '@/lib/catalog';
import {relatedItems} from '@/lib/search';
import {label,itemTitle} from '@/lib/types';
import {Shell} from '@/components/shell';
export const revalidate=300;
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata> {
 const {slug}=await params;
 try{const {catalog}=await getCatalog();const item=catalog.items.find(i=>i.slug===slug);return item?{title:itemTitle(item),description:`Find ${itemTitle(item)} and related accessories in the makerspace.`}:{};}catch{return {title:'Directory unavailable'};}
}
export default async function Page({params}:{params:Promise<{slug:string}>}) {
 const {slug}=await params;const result=await getCatalog().catch(()=>null);
 if(!result)return <Shell><div className="unavailable"><h1>The directory is temporarily unavailable</h1><p>Please try again in a few minutes.</p><Link href="/makerspace" className="button">Back to directory</Link></div></Shell>;
 const {catalog,demo}=result;const item=catalog.items.find(i=>i.slug===slug);if(!item)notFound();
 const related=relatedItems(catalog,item);const Icon=item.kind==='tool'?Wrench:Package;
 return <Shell demo={demo}><article className="detail"><nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/makerspace">Categories</Link><span>/</span><Link href={'/makerspace?category='+item.categories[0]+'&view=all'}>{label(catalog.categories,item.categories[0])}</Link><span>/</span><span>{item.name}</span></nav>
 <div className="detail-title"><span className="detail-icon"><Icon size={39}/></span><div><span className={`kind-badge kind-${item.kind}`}>{item.kind}</span><h1>{item.name}</h1><p>{[item.brand,item.model].filter(Boolean).join(' · ')||label(catalog.types,item.typeKey)}</p></div></div>
 <div className="detail-grid"><section className="property-panel"><div className="panel-heading">Item properties</div><dl><div><dt>Type</dt><dd>{label(catalog.types,item.typeKey)}</dd></div><div><dt>Brand</dt><dd>{item.brand??'Not recorded'}</dd></div><div><dt>Model</dt><dd>{item.model??'Not recorded'}</dd></div></dl>{item.description&&<div className="item-note"><strong>Before you use it</strong><p>{item.description}</p></div>}</section>
 <section className="property-panel"><div className="panel-heading">Explore related work</div><div className="facet-groups">{[['Materials','material',item.materials,catalog.facets.materials],['Tasks','process',item.processes,catalog.facets.processes],['Categories','category',item.categories,catalog.categories]].map(([title,key,values,options])=><div key={title as string}><h2>{title as string}</h2><div className="detail-tags">{(values as string[]).length?(values as string[]).map(v=><Link key={v} href={'/makerspace?'+key+'='+v+'&view=all'}>{label(options as typeof catalog.categories,v)}</Link>):<span className="unspecified">Not recorded</span>}</div></div>)}</div></section></div>
 <section className="related-section"><div className="section-heading"><div><p className="eyebrow">FIND THE REST OF THE SETUP</p><h2>{item.kind==='tool'?'Related accessories':'Related tools'}</h2></div><span className="related-total">{related.length} listed</span></div>{related.length?<><p className="related-intro">Check the fit and specifications before pairing items.</p><div className="related-grid">{related.map(({item:other,relationship:r})=><Link className="related-card" href={'/makerspace/items/'+other.slug} prefetch={false} key={other.id}><div className="related-card-top"><span className={`kind-badge kind-${other.kind}`}>{other.kind}</span><span className={'fit-badge '+r.verification}>{r.verification==='verified'?'Fit verified':'Check fit'}</span></div><h3>{other.name}</h3><p className="related-model">{[other.brand,other.model].filter(Boolean).join(' · ')||label(catalog.types,other.typeKey)}</p>{r.notes&&<p className="compatibility-note">{r.notes}</p>}<span className="related-action">Open item details</span></Link>)}</div></>:<div className="no-related"><FolderOpen size={26}/><p>No related {item.kind==='tool'?'accessories':'tools'} have been recorded for this item.</p></div>}</section><Link className="button" href="/makerspace?view=all">Browse the directory</Link></article></Shell>;
}
