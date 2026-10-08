import Link from 'next/link';
import {Shell} from '@/components/shell';
export default function NotFound(){return <Shell><div className="unavailable"><h1>This item isn’t in the directory.</h1><p>It may have been archived or the link may be incorrect.</p><Link className="button primary" href="/makerspace">Browse categories</Link></div></Shell>}
