"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Box,
  Scissors,
  Hammer,
  Anvil,
  Cpu,
  Shirt,
  Paintbrush,
  Wrench,
  Search,
  SlidersHorizontal,
  X,
  FolderOpen,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Catalog, Filters, Option, kinds, label } from "@/lib/types";
import { filterUrl, parseFilters, searchItems } from "@/lib/search";
const icons: Record<string, LucideIcon> = {
  "3d-printing": Box,
  "laser-cutting": Scissors,
  woodworking: Hammer,
  metalworking: Anvil,
  electronics: Cpu,
  textiles: Shirt,
  crafting: Paintbrush,
  general: Wrench,
};
const categoryColors = [
  "turquoise",
  "red",
  "orange",
  "navy",
  "lime",
  "violet",
  "yellow",
  "blue",
];
export function CatalogBrowser({ catalog }: { catalog: Catalog }) {
  const params = useSearchParams();
  const router = useRouter();
  const filters = parseFilters(new URLSearchParams(params.toString()));
  const [draft, setDraft] = useState(filters.q);
  const [expanded, setExpanded] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => setDraft(filters.q), [filters.q]);
  const active = !!(
    filters.q ||
    filters.category ||
    filters.material ||
    filters.process ||
    filters.kind ||
    filters.view
  );
  const items = active ? searchItems(catalog, filters) : [];
  function change(patch: Partial<Filters>) {
    router.push(filterUrl({ ...filters, ...patch }), { scroll: false });
  }
  function chooseCategory(key: string) {
    change({ category: key, view: true });
    setTimeout(
      () =>
        document.getElementById("results")?.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "instant"
            : "smooth",
          block: "start",
        }),
      100,
    );
  }
  const chips = [
    { key: "category", value: filters.category, options: catalog.categories },
    {
      key: "material",
      value: filters.material,
      options: catalog.facets.materials,
    },
    {
      key: "process",
      value: filters.process,
      options: catalog.facets.processes,
    },
    { key: "kind", value: filters.kind, options: kinds },
  ] as const;
  const chosenCategory = catalog.categories.find(
    (x) => x.key === filters.category,
  );
  return (
    <>
      <section className="search-section" id="search">
        <p className="eyebrow">
          <span className="tiny-square" />
          BUILD WHAT MATTERS
        </p>
        <h1>What are you looking for?</h1>
        <p className="search-intro">
          Find a tool by name, or start with a material or task.
        </p>
        <form
          className="search-form"
          onSubmit={(e) => {
            e.preventDefault();
            change({ q: draft.trim(), view: true });
          }}
          role="search"
        >
          <label className="sr-only" htmlFor="tool-search">
            Search the makerspace
          </label>
          <div className="search-input">
            <Search size={23} aria-hidden="true" />
            <input
              id="tool-search"
              ref={searchRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Try “dremel”, “soldering”, or “cut metal”…"
              maxLength={200}
              type="search"
              autoComplete="off"
            />
          </div>
          <button className="button primary" type="submit">
            Search
          </button>
        </form>
        <div className="search-bottom">
          <span>Try:</span>
          {["dremel", "soldering", "metal"].map((q) => (
            <button
              key={q}
              className="text-button"
              onClick={() => {
                setDraft(q);
                change({
                  q,
                  category: "",
                  material: "",
                  process: "",
                  kind: "",
                  view: true,
                });
              }}
            >
              {q}
            </button>
          ))}
          <button
            className="filter-toggle"
            onClick={() => setExpanded((x) => !x)}
            aria-expanded={expanded}
            aria-controls="facet-filters"
          >
            <SlidersHorizontal size={16} />
            Filter by attribute
          </button>
        </div>
        <div
          id="facet-filters"
          className={`filters ${expanded || active ? "filters-open" : ""}`}
        >
          <Facet
            name="Material"
            options={catalog.facets.materials}
            value={filters.material}
            onChange={(material) => change({ material, view: true })}
          />
          <Facet
            name="Task"
            options={catalog.facets.processes}
            value={filters.process}
            onChange={(process) => change({ process, view: true })}
          />
          <Facet
            name="Item kind"
            options={kinds}
            value={filters.kind}
            onChange={(kind) => change({ kind, view: true })}
          />
          <Facet
            name="Category"
            options={catalog.categories}
            value={filters.category}
            onChange={(category) => change({ category, view: true })}
          />
        </div>
      </section>
      {!active ? (
        <section className="category-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">PICK YOUR WORKBENCH</p>
              <h2>Browse by category</h2>
            </div>
            <button
              className="button small"
              onClick={() => change({ view: true })}
            >
              View all {catalog.items.length} items
            </button>
          </div>
          <div className="category-grid">
            {catalog.categories.map((cat, index) => {
              const Icon = icons[cat.key] ?? FolderOpen;
              const count = catalog.items.filter((i) =>
                i.categories.includes(cat.key),
              ).length;
              return (
                <button
                  className={`category-card ${categoryColors[index % categoryColors.length]}`}
                  key={cat.key}
                  onClick={() => chooseCategory(cat.key)}
                >
                  <span className="card-tab" aria-hidden="true" />
                  <span className="category-icon">
                    <Icon size={30} strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  <span className="category-title">{cat.label}</span>
                  <span className="category-description">
                    {cat.description}
                  </span>
                  <span className="category-count">
                    {count ? `${count} listed items` : "No items listed yet"}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="directory-note">
            <span className="note-label">GOOD TO KNOW</span>
            <p>
              Accessories have their own entries. Open a tool to find the
              related bits, blades, and kits.
            </p>
          </div>
        </section>
      ) : (
        <section className="results-section" id="results" tabIndex={-1}>
          <div className="results-heading">
            <div>
              <p className="eyebrow">DIRECTORY RESULTS</p>
              <h2>
                {chosenCategory?.label ??
                  (filters.q ? `Results for “${filters.q}”` : "All items")}
              </h2>
              <p className="result-count" role="status" aria-live="polite">
                {items.length} {items.length === 1 ? "item" : "items"} found
              </p>
            </div>
            <button
              className="button small"
              onClick={() => {
                router.push("/makerspace", { scroll: false });
                setDraft("");
                setExpanded(false);
              }}
            >
              Back to categories
            </button>
          </div>
          <div className="result-controls">
            <div className="chips">
              {filters.q && (
                <button className="chip" onClick={() => change({ q: "" })}>
                  Search: {filters.q}
                  <X size={14} />
                  <span className="sr-only">Remove search</span>
                </button>
              )}
              {chips
                .filter((c) => c.value)
                .map((c) => (
                  <button
                    className="chip"
                    key={c.key}
                    onClick={() => change({ [c.key]: "" })}
                  >
                    {label(c.options, c.value)}
                    <X size={14} />
                    <span className="sr-only">Remove {c.key} filter</span>
                  </button>
                ))}
              {(filters.q || chips.some((c) => c.value)) && (
                <button
                  className="text-button"
                  onClick={() =>
                    change({
                      q: "",
                      category: "",
                      material: "",
                      process: "",
                      kind: "",
                      view: true,
                    })
                  }
                >
                  Clear filters
                </button>
              )}
            </div>
            <label className="sort-label">
              Sort
              <select
                value={filters.sort}
                onChange={(e) => change({ sort: e.target.value })}
              >
                <option value="relevance">Relevance</option>
                <option value="name">Name A–Z</option>
              </select>
            </label>
          </div>
          {items.length ? (
            <div
              className="table-wrap"
              role="region"
              aria-label="Search results"
              tabIndex={0}
            >
              <table>
                <caption className="sr-only">
                  Tools and related inventory matching your search
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Item / model</th>
                    <th scope="col">Kind</th>
                    <th scope="col">Materials</th>
                    <th scope="col">Tasks</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((i) => (
                    <tr key={i.id}>
                      <td>
                        <Link
                          className="item-link"
                          href={"/makerspace/items/" + i.slug}
                          prefetch={false}
                        >
                          {i.name}
                        </Link>
                        <span className="item-model">
                          {[i.brand, i.model].filter(Boolean).join(" · ") ||
                            label(catalog.types, i.typeKey)}
                        </span>
                      </td>
                      <td>
                        <span className={`kind-badge kind-${i.kind}`}>
                          {i.kind}
                        </span>
                      </td>
                      <td>
                        {i.materials.length ? (
                          i.materials
                            .map((m) => label(catalog.facets.materials, m))
                            .join(", ")
                        ) : (
                          <span className="unspecified">—</span>
                        )}
                      </td>
                      <td>
                        {i.processes.length ? (
                          i.processes
                            .map((p) => label(catalog.facets.processes, p))
                            .join(", ")
                        ) : (
                          <span className="unspecified">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <FolderOpen size={38} />
              <h3>No items match yet.</h3>
              <p>
                {filters.category === "laser-cutting"
                  ? "The supplied inventory does not list laser-cutting equipment."
                  : "Try a broader search or remove one of the filters."}
              </p>
              <button
                className="button"
                onClick={() =>
                  change({
                    q: "",
                    category: "",
                    material: "",
                    process: "",
                    kind: "",
                    view: true,
                  })
                }
              >
                Browse all items
              </button>
            </div>
          )}
          <p className="results-footnote">
            Material tags help you discover items. Confirm the correct
            attachment and setup before use.
          </p>
        </section>
      )}
    </>
  );
}
function Facet({
  name,
  options,
  value,
  onChange,
}: {
  name: string;
  options: Option[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="facet">
      <span>{name}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Any {name.toLowerCase()}</option>
        {options.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
