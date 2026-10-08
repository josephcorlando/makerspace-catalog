import Link from "next/link";
import { Grid2X2, FolderOpen, Search, Wrench } from "lucide-react";
export function Shell({
  children,
  demo = false,
}: {
  children: React.ReactNode;
  demo?: boolean;
}) {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="desktop-bar">
        <Link href="/makerspace" className="brand">
          <span className="brand-icon">
            <Grid2X2 size={25} />
          </span>
          <span>
            HIVE<span className="brand-light">LABS</span>
            <small>TOOL DIRECTORY</small>
          </span>
        </Link>
        <span className="edition">The tools are here.</span>
        <Link href="/makerspace?view=all" className="top-link">
          Browse all items
        </Link>
      </header>

      <div className="desktop">
        <div className="window">
          <div className="title-bar">
            <div>
              <FolderOpen size={18} aria-hidden="true" />
              <span>Makerspace — Tools & Accessories</span>
            </div>
            <span className="window-mark" aria-hidden="true">
              ▰
            </span>
          </div>
          <nav className="menu-bar" aria-label="Directory">
            <Link href="/makerspace">
              <FolderOpen size={16} />
              Categories
            </Link>
            <Link href="/makerspace?view=all">
              <Wrench size={16} />
              All items
            </Link>
            <a href="/makerspace#search">
              <Search size={16} />
              Search
            </a>
            <span className="menu-note">Buzz. Build. Belong.</span>
          </nav>
          {demo && (
            <div className="preview-note">
              Preview of the imported inventory · database not connected
            </div>
          )}
          <div className="preview-note">
            Unofficial HiveLabs tool directory. Not affiliated with, endorsed
            by, or associated with HiveLabs.
          </div>
          <main id="main">{children}</main>
          <footer className="status-bar">
            <span>HIVELAB TOOL DIRECTORY</span>
            <span>Tools + accessories + possibilities</span>
            <span className="version">v1.0</span>
          </footer>
        </div>
        <p className="desktop-footer">
          Building together. Creating sustainably.
        </p>
      </div>
    </>
  );
}
