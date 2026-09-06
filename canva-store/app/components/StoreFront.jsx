"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./store.module.css";
import AIAssistant from "./AIAssistant";

// Deterministic color per category so the same category always renders the
// same gradient, without needing real cover-image art for every demo product.
const PALETTE = [
  ["#2b3df2", "#1524a8"],
  ["#ff5d6c", "#c9273a"],
  ["#0c8a5e", "#0a5c40"],
  ["#9b5cf6", "#5b21b6"],
  ["#e08a1e", "#a35f0f"],
  ["#3b5bdb", "#1e3a8a"],
  ["#14b8a6", "#0d6b60"],
  ["#7c3f00", "#4a2600"],
];
function colorsFor(category) {
  let hash = 0;
  for (let i = 0; i < category.length; i++) hash = (hash * 31 + category.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

export default function StoreFront({ products }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [showTop, setShowTop] = useState(false);

  const categories = ["All", ...Array.from(new Set(products.map((p) => p.category)))];
  const visible = activeCategory === "All" ? products : products.filter((p) => p.category === activeCategory);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 500);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className={styles.storeRoot}>
      <div className={styles.topBar}>
        <div className={styles.topBarInner}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button
              className={`${styles.hamburger} ${menuOpen ? styles.hamburgerOpen : ""}`}
              aria-label="Open menu"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span></span><span></span><span></span>
            </button>
            <div className={styles.logo}><span className={styles.logoMark}></span>TemplateTreasury</div>
          </div>
          <div className={styles.navLinks}>
            <a href="#grid">Shop</a>
            <a href="#" onClick={(e) => { e.preventDefault(); setMenuOpen(true); }}>Categories</a>
          </div>
        </div>
      </div>

      <div
        className={`${styles.drawerOverlay} ${menuOpen ? styles.drawerOverlayOpen : ""}`}
        onClick={() => setMenuOpen(false)}
      />
      <nav className={`${styles.drawer} ${menuOpen ? styles.drawerOpen : ""}`} aria-label="Site menu">
        <div className={styles.drawerHead}>
          <div className={styles.logo}><span className={styles.logoMark}></span>TemplateTreasury</div>
          <button className={styles.drawerClose} onClick={() => setMenuOpen(false)} aria-label="Close menu">✕</button>
        </div>
        <div className={styles.drawerHeading}>Shop by category</div>
        {categories.map((c) => {
          const count = c === "All" ? products.length : products.filter((p) => p.category === c).length;
          return (
            <div
              key={c}
              className={styles.drawerCat}
              onClick={() => { setActiveCategory(c); setMenuOpen(false); }}
            >
              {c}
              <span className={styles.drawerCatCount}>{count}</span>
            </div>
          );
        })}
        <div className={styles.drawerHeading}>Site</div>
        <div className={styles.drawerLinks}>
          <a href="#grid" onClick={() => setMenuOpen(false)}>All templates</a>
        </div>
      </nav>

      <div className={styles.wrap} style={{ paddingTop: 56, paddingBottom: 44 }}>
        <div className={styles.heroGrid}>
          <div>
            <h1 className={styles.serif}>
              Templates that make<br /><em>launch day</em> feel done.
            </h1>
            <p>Editable Canva templates for social posts, resumes, invitations and pitch decks - buy once, open in Canva, make it yours.</p>
            <a href="#grid" className={`${styles.btn} ${styles.btnInk}`}>Browse templates</a>
          </div>
          <div className={styles.stack}>
            <div className={`${styles.cardArt} ${styles.a3}`}><div className={styles.cardTag}>Pitch Deck</div><div className={styles.cardTitle}>Series A</div></div>
            <div className={`${styles.cardArt} ${styles.a2}`}><div className={styles.cardTag}>Instagram</div><div className={styles.cardTitle}>Launch Grid</div></div>
            <div className={`${styles.cardArt} ${styles.a1}`}><div className={styles.cardTag}>Resume</div><div className={styles.cardTitle}>Clean Slate</div></div>
          </div>
        </div>
      </div>

      <div className={styles.wrap} id="grid">
        <div className={styles.chips}>
          {categories.map((c) => (
            <button
              key={c}
              className={`${styles.chip} ${activeCategory === c ? styles.chipActive : ""}`}
              onClick={() => setActiveCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <p className={styles.empty}>No templates published yet.</p>
        ) : (
          <div className={styles.grid}>
            {visible.map((p) => {
              const [c1, c2] = colorsFor(p.category);
              return (
                <Link key={p.id} href={`/products/${p.slug}`} className={styles.product}>
                  <div className={styles.art} style={{ background: `linear-gradient(160deg, ${c1}, ${c2})` }}>
                    <span className={styles.catLabel}>{p.category}</span>
                    <span className={styles.artTitle}>{p.title}</span>
                  </div>
                  <div className={styles.productBody}>
                    <h3>{p.title}</h3>
                    <p>{p.caption}</p>
                    <div className={styles.priceRow}>
                      <span className={styles.inr}>₹{(p.priceInr / 100).toFixed(0)}</span>
                      <span className={styles.usd}>${(p.priceUsd / 100).toFixed(2)}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <div className={styles.wrap}>TemplateTreasury - editable Canva templates, delivered instantly.</div>
      </div>

      <button className={`${styles.totop} ${showTop ? styles.totopShow : ""}`} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Back to top">↑</button>

      <AIAssistant products={products} categories={categories.filter((c) => c !== "All")} setActiveCategory={setActiveCategory} />
    </div>
  );
}
