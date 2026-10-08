'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <div className="unavailable"><h1>Something interrupted the directory.</h1><p>Please try opening it again.</p><button className="button primary" onClick={reset}>Try again</button></div>}
