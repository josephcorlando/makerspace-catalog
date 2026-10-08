import {Suspense} from 'react';
import {getCatalog} from '@/lib/catalog';
import {Shell} from '@/components/shell';
import {CatalogBrowser} from '@/components/catalog-browser';
export const revalidate=300;
export default async function Page() {
 try { const {catalog,demo}=await getCatalog();return <Shell demo={demo}><Suspense fallback={<p className="loading">Opening the directory…</p>}><CatalogBrowser catalog={catalog}/></Suspense></Shell>; }
 catch { return <Shell><div className="unavailable"><h1>The directory is temporarily unavailable</h1><p>Please try again in a few minutes.</p><a className="button primary" href="/makerspace">Try again</a></div></Shell>; }
}
