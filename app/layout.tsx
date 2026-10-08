import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:{default:'Makerspace · Tool Directory',template:'%s · Makerspace'},description:'Find makerspace tools, materials, processes, and related accessories.',icons:{icon:'/makerspace/icon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="en"><body>{children}</body></html>}
