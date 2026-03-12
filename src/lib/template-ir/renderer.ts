/* ─────────────────────────────────────────────────────────────────────────
 * IR → HTML 렌더러 (LLM 무호출)
 * TemplateIR을 받아 즉시 사이트 HTML을 생성한다.
 * ───────────────────────────────────────────────────────────────────────── */

import type { TemplateIR, ComponentIR, SlotIR, StyleTokens, GeneratedFiles } from "./types";

/* ── CSS helpers ── */
const RADIUS_MAP: Record<string, string> = {
    none: "0px", sm: "4px", md: "8px", lg: "16px", full: "9999px",
};
const SPACING_MAP: Record<string, string> = {
    compact: "3rem 1rem", normal: "5rem 2rem", relaxed: "7rem 2rem",
};

function isDark(bg: string): boolean {
    const hex = bg.replace("#", "");
    if (hex.length < 6) return true;
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

function slotText(slot: SlotIR | undefined, fallback = ""): string {
    if (!slot) return fallback;
    return String(slot.value ?? fallback);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function slotList(slot: SlotIR | undefined): any[] {
    if (!slot || !Array.isArray(slot.value)) return [];
    return slot.value;
}

/* ────────────────────────────────────────────────────────────────────────
 * CSS Generator
 * ──────────────────────────────────────────────────────────────────────── */
function generateCSS(tokens: StyleTokens): string {
    const dark = isDark(tokens.colors.background);
    const radius = RADIUS_MAP[tokens.borderRadius] ?? "8px";
    const sp = SPACING_MAP[tokens.spacing] ?? "5rem 2rem";
    const cardBg = dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)";
    const cardBorder = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
    const navBg = dark ? "rgba(3,7,18,0.85)" : "rgba(255,255,255,0.9)";

    return `
@import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(tokens.fonts.heading)}:wght@400;600;700;800&family=${encodeURIComponent(tokens.fonts.body)}:wght@400;500;600&display=swap');

:root {
  --primary:    ${tokens.colors.primary};
  --secondary:  ${tokens.colors.secondary};
  --accent:     ${tokens.colors.accent};
  --bg:         ${tokens.colors.background};
  --text:       ${tokens.colors.text};
  --muted:      ${tokens.colors.muted};
  --radius:     ${radius};
  --sp:         ${sp};
  --font-h:     '${tokens.fonts.heading}', system-ui, sans-serif;
  --font-b:     '${tokens.fonts.body}', system-ui, sans-serif;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; font-size: 16px; }
body { background: var(--bg); color: var(--text); font-family: var(--font-b); line-height: 1.65; -webkit-font-smoothing: antialiased; }
h1, h2, h3, h4 { font-family: var(--font-h); line-height: 1.15; }
a { color: inherit; text-decoration: none; }
img { max-width: 100%; height: auto; }

/* Layout */
.container { max-width: 1200px; margin: 0 auto; padding: 0 2rem; }
.section { padding: var(--sp); }
.section-center { text-align: center; }
.section-label { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--primary); margin-bottom: 0.75rem; }
.section-title { font-size: clamp(1.75rem, 4vw, 2.75rem); font-weight: 800; margin-bottom: 1rem; }
.section-title span { background: linear-gradient(135deg, var(--primary), var(--secondary)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.section-sub { font-size: 1.05rem; color: var(--muted); max-width: 580px; margin: 0 auto 3.5rem; line-height: 1.7; }

/* Buttons */
.btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.85rem 2rem; border-radius: var(--radius); font-weight: 700; font-size: 0.95rem; cursor: pointer; border: none; transition: all 0.25s ease; }
.btn-primary { background: linear-gradient(135deg, var(--primary), var(--secondary)); color: #fff; box-shadow: 0 4px 20px color-mix(in srgb, var(--primary) 30%, transparent); }
.btn-primary:hover { opacity: 0.9; transform: translateY(-2px); box-shadow: 0 8px 28px color-mix(in srgb, var(--primary) 40%, transparent); }
.btn-outline { border: 2px solid color-mix(in srgb, var(--text) 25%, transparent); color: var(--text); background: transparent; }
.btn-outline:hover { border-color: var(--primary); color: var(--primary); background: color-mix(in srgb, var(--primary) 8%, transparent); }

/* Cards */
.card { background: ${cardBg}; border: 1px solid ${cardBorder}; border-radius: var(--radius); padding: 2rem; transition: all 0.3s ease; }
.card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.15); border-color: color-mix(in srgb, var(--primary) 30%, transparent); }
.grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
.grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 2rem; }
.grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; }

/* Navbar */
.navbar { position: fixed; top: 0; left: 0; right: 0; z-index: 100; background: ${navBg}; backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-bottom: 1px solid ${cardBorder}; }
.navbar-inner { display: flex; align-items: center; justify-content: space-between; height: 4rem; }
.navbar-logo { font-family: var(--font-h); font-size: 1.2rem; font-weight: 800; background: linear-gradient(135deg, var(--primary), var(--secondary)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.navbar-menu { display: flex; align-items: center; gap: 2rem; list-style: none; }
.navbar-menu a { font-size: 0.875rem; font-weight: 500; color: var(--muted); transition: color 0.2s; }
.navbar-menu a:hover { color: var(--text); }
.navbar-cta { margin-left: 1.5rem; }
.nav-spacer { height: 4rem; }

/* Hero */
.hero { min-height: 100vh; display: flex; align-items: center; justify-content: center; text-align: center; position: relative; overflow: hidden; padding: 6rem 2rem 4rem; }
.hero::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 80% 60% at 50% 0%, color-mix(in srgb, var(--primary) 15%, transparent) 0%, transparent 70%); pointer-events: none; }
.hero-content { position: relative; max-width: 820px; }
.hero-title { font-size: clamp(2.5rem, 6vw, 4.5rem); font-weight: 800; line-height: 1.08; margin-bottom: 1.5rem; }
.hero-title .gradient { background: linear-gradient(135deg, var(--primary), var(--accent)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.hero-sub { font-size: clamp(1rem, 2vw, 1.2rem); color: var(--muted); max-width: 600px; margin: 0 auto 2.5rem; line-height: 1.75; }
.hero-actions { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; margin-bottom: 2rem; }
.hero-proof { font-size: 0.8rem; color: var(--muted); }

/* Features */
.feat-icon { width: 52px; height: 52px; border-radius: 12px; background: linear-gradient(135deg, color-mix(in srgb, var(--primary) 20%, transparent), color-mix(in srgb, var(--secondary) 20%, transparent)); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin-bottom: 1.25rem; }
.feat-title { font-size: 1.05rem; font-weight: 700; margin-bottom: 0.5rem; }
.feat-desc { font-size: 0.875rem; color: var(--muted); line-height: 1.65; }

/* Stats */
.stats-section { padding: var(--sp); background: color-mix(in srgb, var(--primary) 5%, var(--bg)); border-top: 1px solid ${cardBorder}; border-bottom: 1px solid ${cardBorder}; }
.stats-inner { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2rem; text-align: center; }
.stat-num { font-size: clamp(2rem, 4vw, 3rem); font-weight: 800; background: linear-gradient(135deg, var(--primary), var(--accent)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.stat-label { font-size: 0.85rem; color: var(--muted); margin-top: 0.25rem; }

/* Gallery */
.gallery-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; }
.gallery-item { position: relative; border-radius: var(--radius); overflow: hidden; aspect-ratio: 4/3; cursor: pointer; }
.gallery-bg { width: 100%; height: 100%; transition: transform 0.5s ease; }
.gallery-item:hover .gallery-bg { transform: scale(1.05); }
.gallery-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0); transition: background 0.3s; display: flex; flex-direction: column; justify-content: flex-end; padding: 1.5rem; }
.gallery-item:hover .gallery-overlay { background: rgba(0,0,0,0.55); }
.gallery-title { font-size: 1rem; font-weight: 700; opacity: 0; transform: translateY(8px); transition: all 0.3s; }
.gallery-cat { font-size: 0.75rem; color: var(--primary); opacity: 0; transform: translateY(8px); transition: all 0.3s 0.05s; }
.gallery-item:hover .gallery-title, .gallery-item:hover .gallery-cat { opacity: 1; transform: translateY(0); }

/* Testimonials */
.testi-card { padding: 2rem; }
.testi-quote { font-size: 3rem; line-height: 1; color: var(--primary); opacity: 0.3; font-family: Georgia, serif; margin-bottom: 0.5rem; }
.testi-text { font-size: 0.95rem; color: var(--muted); line-height: 1.75; font-style: italic; margin-bottom: 1.5rem; }
.testi-avatar { width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), var(--secondary)); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.875rem; color: #fff; flex-shrink: 0; }
.testi-author { display: flex; align-items: center; gap: 0.75rem; }
.testi-name { font-weight: 700; font-size: 0.875rem; }
.testi-role { font-size: 0.75rem; color: var(--muted); }
.stars { color: #f59e0b; font-size: 0.875rem; margin-bottom: 1rem; }

/* Pricing */
.pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; align-items: start; }
.pricing-card { padding: 2rem; position: relative; }
.pricing-card.popular { border-color: var(--primary); box-shadow: 0 0 40px color-mix(in srgb, var(--primary) 20%, transparent); transform: scale(1.03); }
.pricing-badge { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, var(--primary), var(--secondary)); color: #fff; font-size: 0.7rem; font-weight: 700; padding: 0.25rem 1rem; border-radius: 9999px; white-space: nowrap; }
.pricing-name { font-size: 1.1rem; font-weight: 700; margin-bottom: 1rem; }
.pricing-price { font-size: 2.5rem; font-weight: 800; line-height: 1; margin-bottom: 0.25rem; }
.pricing-price span { font-size: 1rem; font-weight: 500; color: var(--muted); }
.pricing-features { list-style: none; margin: 1.5rem 0; space-y: 0.75rem; }
.pricing-features li { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: var(--muted); padding: 0.4rem 0; border-bottom: 1px solid ${cardBorder}; }
.pricing-features li::before { content: '✓'; color: var(--primary); font-weight: 700; flex-shrink: 0; }
.pricing-btn { width: 100%; text-align: center; justify-content: center; margin-top: 1.5rem; }

/* About */
.about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center; }
.about-img { border-radius: var(--radius); aspect-ratio: 4/3; background: linear-gradient(135deg, color-mix(in srgb, var(--primary) 20%, var(--bg)), color-mix(in srgb, var(--secondary) 20%, var(--bg))); display: flex; align-items: center; justify-content: center; font-size: 4rem; }
.about-skills { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 1.5rem; }
.skill-tag { padding: 0.35rem 0.85rem; border-radius: 9999px; background: color-mix(in srgb, var(--primary) 12%, transparent); border: 1px solid color-mix(in srgb, var(--primary) 25%, transparent); color: var(--primary); font-size: 0.8rem; font-weight: 600; }
.about-stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-top: 2rem; }
.about-stat { padding: 1rem; border-radius: var(--radius); background: color-mix(in srgb, var(--primary) 5%, transparent); border: 1px solid ${cardBorder}; text-align: center; }
.about-stat-num { font-size: 1.75rem; font-weight: 800; color: var(--primary); }
.about-stat-label { font-size: 0.75rem; color: var(--muted); margin-top: 0.2rem; }

/* Contact */
.contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; }
.contact-info-item { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
.contact-icon { font-size: 1.25rem; flex-shrink: 0; }
.contact-label { font-size: 0.75rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; }
.contact-val { font-weight: 600; margin-top: 0.2rem; }
.form-group { margin-bottom: 1.25rem; }
.form-label { display: block; font-size: 0.8rem; font-weight: 600; color: var(--muted); margin-bottom: 0.4rem; text-transform: uppercase; letter-spacing: 0.06em; }
.form-input { width: 100%; padding: 0.75rem 1rem; border-radius: var(--radius); background: ${cardBg}; border: 1px solid ${cardBorder}; color: var(--text); font-family: var(--font-b); font-size: 0.9rem; transition: border-color 0.2s; outline: none; }
.form-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 15%, transparent); }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
textarea.form-input { min-height: 130px; resize: vertical; }

/* CTA Banner */
.cta-section { padding: var(--sp); background: linear-gradient(135deg, var(--primary), var(--secondary)); position: relative; overflow: hidden; }
.cta-section::before { content: ''; position: absolute; inset: 0; background-image: radial-gradient(circle at 20% 50%, rgba(255,255,255,0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 50%); }
.cta-inner { position: relative; text-align: center; max-width: 640px; margin: 0 auto; }
.cta-title { font-size: clamp(1.75rem, 4vw, 2.5rem); font-weight: 800; color: #fff; margin-bottom: 1rem; }
.cta-sub { color: rgba(255,255,255,0.8); margin-bottom: 2.5rem; font-size: 1.05rem; }
.btn-white { background: #fff; color: var(--primary); }
.btn-white:hover { background: rgba(255,255,255,0.92); transform: translateY(-2px); }

/* Footer */
.footer { padding: 4rem 2rem 2rem; background: color-mix(in srgb, #000 40%, var(--bg)); border-top: 1px solid ${cardBorder}; }
.footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 3rem; margin-bottom: 3rem; }
.footer-logo { font-family: var(--font-h); font-size: 1.3rem; font-weight: 800; background: linear-gradient(135deg, var(--primary), var(--secondary)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 0.75rem; }
.footer-tagline { font-size: 0.875rem; color: var(--muted); }
.footer-col-title { font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); margin-bottom: 1rem; }
.footer-links { list-style: none; }
.footer-links li { margin-bottom: 0.6rem; }
.footer-links a { font-size: 0.875rem; color: var(--muted); transition: color 0.2s; }
.footer-links a:hover { color: var(--text); }
.footer-bottom { padding-top: 2rem; border-top: 1px solid ${cardBorder}; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; }
.footer-copy { font-size: 0.8rem; color: var(--muted); }

/* Responsive */
@media (max-width: 1024px) {
  .grid-3, .gallery-grid, .pricing-grid { grid-template-columns: repeat(2, 1fr); }
  .grid-4, .stats-inner { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
  .grid-3, .grid-2, .grid-4, .gallery-grid, .pricing-grid, .stats-inner, .about-grid, .contact-grid, .footer-grid { grid-template-columns: 1fr; }
  .pricing-card.popular { transform: none; }
  .navbar-menu { display: none; }
  .hero-actions { flex-direction: column; align-items: center; }
  .form-row { grid-template-columns: 1fr; }
}
`.trim();
}

/* ────────────────────────────────────────────────────────────────────────
 * Component renderers
 * ──────────────────────────────────────────────────────────────────────── */

function renderNavbar(comp: ComponentIR): string {
    const logo = slotText(comp.slots.logo, "Brand");
    const items = slotList(comp.slots.menuItems) as string[];
    const ctaText = slotText(comp.slots.ctaText, "Get Started");
    const ctaLink = slotText(comp.slots.ctaLink, "#");

    return `
<nav class="navbar">
  <div class="container navbar-inner">
    <a href="/" class="navbar-logo">${logo}</a>
    <ul class="navbar-menu">
      ${items.map(item => `<li><a href="#${item.toLowerCase().replace(/\s+/g, "-")}">${item}</a></li>`).join("")}
      <li class="navbar-cta"><a href="${ctaLink}" class="btn btn-primary" style="padding:0.6rem 1.4rem;font-size:0.85rem">${ctaText}</a></li>
    </ul>
  </div>
</nav>
<div class="nav-spacer"></div>`;
}

function renderHero(comp: ComponentIR): string {
    const title = slotText(comp.slots.title, "Welcome");
    const subtitle = slotText(comp.slots.subtitle, "");
    const ctaText = slotText(comp.slots.ctaText, "Get Started");
    const ctaLink = slotText(comp.slots.ctaLink, "#");
    const secondaryText = slotText(comp.slots.secondaryCtaText, "");
    const socialProof = slotText(comp.slots.socialProof, "");

    const titleParts = title.split(" ");
    const gradientWord = titleParts.length > 1 ? titleParts[titleParts.length - 1] : title;
    const beforeGradient = titleParts.length > 1 ? titleParts.slice(0, -1).join(" ") + " " : "";

    return `
<section class="hero">
  <div class="hero-content">
    <div class="section-label">✦ AI-Powered Platform</div>
    <h1 class="hero-title">${beforeGradient}<span class="gradient">${gradientWord}</span></h1>
    <p class="hero-sub">${subtitle}</p>
    <div class="hero-actions">
      <a href="${ctaLink}" class="btn btn-primary">🚀 ${ctaText}</a>
      ${secondaryText ? `<a href="#demo" class="btn btn-outline">${secondaryText}</a>` : ""}
    </div>
    ${socialProof ? `<p class="hero-proof">✓ ${socialProof}</p>` : ""}
  </div>
</section>`;
}

function renderFeatures(comp: ComponentIR): string {
    const title = slotText(comp.slots.sectionTitle, "Features");
    const subtitle = slotText(comp.slots.sectionSubtitle, "");
    const items = slotList(comp.slots.items) as Array<{ icon: string; title: string; desc: string }>;

    return `
<section id="features" class="section">
  <div class="container">
    <div class="section-center">
      <div class="section-label">기능</div>
      <h2 class="section-title"><span>${title}</span></h2>
      ${subtitle ? `<p class="section-sub">${subtitle}</p>` : ""}
    </div>
    <div class="grid-3">
      ${items.map(item => `
      <div class="card">
        <div class="feat-icon">${item.icon || "✨"}</div>
        <div class="feat-title">${item.title}</div>
        <div class="feat-desc">${item.desc}</div>
      </div>`).join("")}
    </div>
  </div>
</section>`;
}

function renderStats(comp: ComponentIR): string {
    const items = slotList(comp.slots.items) as Array<{ number: string; label: string }>;

    return `
<section class="stats-section">
  <div class="container">
    <div class="stats-inner">
      ${items.map(item => `
      <div>
        <div class="stat-num">${item.number}</div>
        <div class="stat-label">${item.label}</div>
      </div>`).join("")}
    </div>
  </div>
</section>`;
}

function renderTestimonials(comp: ComponentIR): string {
    const title = slotText(comp.slots.sectionTitle, "Testimonials");
    const items = slotList(comp.slots.items) as Array<{ quote: string; name: string; role: string }>;

    return `
<section id="testimonials" class="section">
  <div class="container">
    <div class="section-center">
      <div class="section-label">후기</div>
      <h2 class="section-title"><span>${title}</span></h2>
    </div>
    <div class="grid-3">
      ${items.map(item => `
      <div class="card testi-card">
        <div class="stars">★★★★★</div>
        <div class="testi-quote">"</div>
        <p class="testi-text">${item.quote}</p>
        <div class="testi-author">
          <div class="testi-avatar">${item.name.charAt(0)}</div>
          <div>
            <div class="testi-name">${item.name}</div>
            <div class="testi-role">${item.role}</div>
          </div>
        </div>
      </div>`).join("")}
    </div>
  </div>
</section>`;
}

function renderPricing(comp: ComponentIR): string {
    const title = slotText(comp.slots.sectionTitle, "Pricing");
    const subtitle = slotText(comp.slots.sectionSubtitle, "");
    const plans = slotList(comp.slots.plans) as Array<{ name: string; price: string; period: string; popular: boolean; features: string[] }>;

    return `
<section id="pricing" class="section">
  <div class="container">
    <div class="section-center">
      <div class="section-label">요금제</div>
      <h2 class="section-title"><span>${title}</span></h2>
      ${subtitle ? `<p class="section-sub">${subtitle}</p>` : ""}
    </div>
    <div class="pricing-grid">
      ${plans.map(plan => `
      <div class="card pricing-card${plan.popular ? " popular" : ""}">
        ${plan.popular ? `<div class="pricing-badge">POPULAR</div>` : ""}
        <div class="pricing-name">${plan.name}</div>
        <div class="pricing-price">${plan.price}<span>${plan.period}</span></div>
        <ul class="pricing-features">
          ${plan.features.map(f => `<li>${f}</li>`).join("")}
        </ul>
        <a href="#contact" class="btn ${plan.popular ? "btn-primary" : "btn-outline"} pricing-btn">시작하기</a>
      </div>`).join("")}
    </div>
  </div>
</section>`;
}

function renderGallery(comp: ComponentIR): string {
    const title = slotText(comp.slots.sectionTitle, "Work");
    const subtitle = slotText(comp.slots.sectionSubtitle, "");
    const items = slotList(comp.slots.items) as Array<{ title: string; category: string; year: string; color: string }>;

    const colors = ["#6366f1,#8b5cf6", "#3b82f6,#06b6d4", "#22c55e,#14b8a6", "#f97316,#ec4899", "#a78bfa,#c084fc", "#e11d48,#dc2626"];

    return `
<section id="work" class="section">
  <div class="container">
    <div class="section-center">
      <div class="section-label">작업물</div>
      <h2 class="section-title"><span>${title}</span></h2>
      ${subtitle ? `<p class="section-sub">${subtitle}</p>` : ""}
    </div>
    <div class="gallery-grid">
      ${items.map((item, i) => {
        const [from, to] = colors[i % colors.length].split(",");
        return `
      <div class="gallery-item">
        <div class="gallery-bg" style="background:linear-gradient(135deg,${from},${to})"></div>
        <div class="gallery-overlay">
          <div class="gallery-cat">${item.category} · ${item.year}</div>
          <div class="gallery-title">${item.title}</div>
        </div>
      </div>`;
    }).join("")}
    </div>
  </div>
</section>`;
}

function renderAbout(comp: ComponentIR): string {
    const title = slotText(comp.slots.sectionTitle, "About");
    const bio = slotText(comp.slots.bio, "");
    const skills = slotList(comp.slots.skills) as string[];
    const stats = slotList(comp.slots.stats) as Array<{ number: string; label: string }>;

    return `
<section id="about" class="section">
  <div class="container">
    <div class="about-grid">
      <div class="about-img">🏢</div>
      <div>
        <div class="section-label">소개</div>
        <h2 class="section-title">${title}</h2>
        <p style="color:var(--muted);line-height:1.8;margin-bottom:1rem">${bio}</p>
        ${skills.length > 0 ? `
        <div class="about-skills">
          ${skills.map(s => `<span class="skill-tag">${s}</span>`).join("")}
        </div>` : ""}
        ${stats.length > 0 ? `
        <div class="about-stats">
          ${stats.map(s => `
          <div class="about-stat">
            <div class="about-stat-num">${s.number}</div>
            <div class="about-stat-label">${s.label}</div>
          </div>`).join("")}
        </div>` : ""}
      </div>
    </div>
  </div>
</section>`;
}

function renderContactForm(comp: ComponentIR): string {
    const title = slotText(comp.slots.sectionTitle, "Contact");
    const subtitle = slotText(comp.slots.sectionSubtitle, "");
    const email = slotText(comp.slots.email, "");
    const phone = slotText(comp.slots.phone, "");
    const address = slotText(comp.slots.address, "");
    const availability = slotText(comp.slots.availability, "");

    return `
<section id="contact" class="section">
  <div class="container">
    <div class="section-center">
      <div class="section-label">연락처</div>
      <h2 class="section-title"><span>${title}</span></h2>
      ${subtitle ? `<p class="section-sub">${subtitle}</p>` : ""}
    </div>
    <div class="contact-grid">
      <div>
        ${email ? `<div class="contact-info-item"><div class="contact-icon">✉️</div><div><div class="contact-label">이메일</div><div class="contact-val">${email}</div></div></div>` : ""}
        ${phone ? `<div class="contact-info-item"><div class="contact-icon">📞</div><div><div class="contact-label">전화</div><div class="contact-val">${phone}</div></div></div>` : ""}
        ${address ? `<div class="contact-info-item"><div class="contact-icon">📍</div><div><div class="contact-label">주소</div><div class="contact-val">${address}</div></div></div>` : ""}
        ${availability ? `<div class="contact-info-item"><div class="contact-icon">🕐</div><div><div class="contact-label">운영시간</div><div class="contact-val">${availability}</div></div></div>` : ""}
      </div>
      <div>
        <form onsubmit="event.preventDefault()">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">이름</label>
              <input class="form-input" type="text" placeholder="홍길동">
            </div>
            <div class="form-group">
              <label class="form-label">이메일</label>
              <input class="form-input" type="email" placeholder="name@example.com">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">주제</label>
            <input class="form-input" type="text" placeholder="무엇을 도와드릴까요?">
          </div>
          <div class="form-group">
            <label class="form-label">메시지</label>
            <textarea class="form-input" placeholder="자세한 내용을 적어주세요..."></textarea>
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center">전송하기 →</button>
          <p style="font-size:0.75rem;color:var(--muted);margin-top:0.75rem;text-align:center">제출 시 개인정보처리방침에 동의합니다</p>
        </form>
      </div>
    </div>
  </div>
</section>`;
}

function renderCTA(comp: ComponentIR): string {
    const title = slotText(comp.slots.title, "Ready to start?");
    const subtitle = slotText(comp.slots.subtitle, "");
    const btnText = slotText(comp.slots.buttonText, "Get Started");
    const btnLink = slotText(comp.slots.buttonLink, "#");

    return `
<section class="cta-section">
  <div class="container">
    <div class="cta-inner">
      <h2 class="cta-title">${title}</h2>
      ${subtitle ? `<p class="cta-sub">${subtitle}</p>` : ""}
      <a href="${btnLink}" class="btn btn-white">🚀 ${btnText}</a>
    </div>
  </div>
</section>`;
}

function renderFooter(comp: ComponentIR): string {
    const logo = slotText(comp.slots.logo, "Brand");
    const tagline = slotText(comp.slots.tagline, "");
    const copyright = slotText(comp.slots.copyright, "© 2026 All rights reserved.");
    const links = slotList(comp.slots.links) as Array<{ text: string; url: string }>;

    return `
<footer class="footer">
  <div class="container">
    <div class="footer-grid">
      <div>
        <div class="footer-logo">${logo}</div>
        ${tagline ? `<div class="footer-tagline">${tagline}</div>` : ""}
      </div>
      <div>
        <div class="footer-col-title">바로가기</div>
        <ul class="footer-links">
          ${links.slice(0, Math.ceil(links.length / 2)).map(l => `<li><a href="${l.url}">${l.text}</a></li>`).join("")}
        </ul>
      </div>
      <div>
        <div class="footer-col-title">링크</div>
        <ul class="footer-links">
          ${links.slice(Math.ceil(links.length / 2)).map(l => `<li><a href="${l.url}">${l.text}</a></li>`).join("")}
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <div class="footer-copy">${copyright}</div>
      <div class="footer-copy" style="display:flex;gap:1.5rem">
        ${links.map(l => `<a href="${l.url}" style="color:var(--muted);font-size:0.8rem;transition:color 0.2s" onmouseover="this.style.color='var(--text)'" onmouseout="this.style.color='var(--muted)'">${l.text}</a>`).join("")}
      </div>
    </div>
  </div>
</footer>`;
}

/* ────────────────────────────────────────────────────────────────────────
 * Main renderer
 * ──────────────────────────────────────────────────────────────────────── */
function renderComponentContent(comp: ComponentIR): string {
    switch (comp.type) {
        case "Navbar":       return renderNavbar(comp);
        case "Hero":         return renderHero(comp);
        case "Features":     return renderFeatures(comp);
        case "Stats":        return renderStats(comp);
        case "Gallery":      return renderGallery(comp);
        case "Testimonials": return renderTestimonials(comp);
        case "Pricing":      return renderPricing(comp);
        case "About":        return renderAbout(comp);
        case "ContactForm":  return renderContactForm(comp);
        case "CTA":          return renderCTA(comp);
        case "Footer":       return renderFooter(comp);
        default: return `<!-- Unknown component: ${comp.type} -->`;
    }
}

// Wrap each component in a clickable block with a data-cid attribute
// so IREditorPanel can detect which section was clicked via postMessage.
function renderComponent(comp: ComponentIR): string {
    if (!comp.visible) return "";
    const inner = renderComponentContent(comp);
    return `<div data-cid="${comp.id}" class="__ir">${inner}</div>`;
}

// Script injected into the iframe for click-to-select and highlight.
const IR_INTERACTION_SCRIPT = `
<script>
(function(){
  var selected = null;
  function highlight(id){
    document.querySelectorAll('.__ir').forEach(function(el){
      el.style.outline='';
      el.style.outlineOffset='';
      el.style.transition='';
    });
    if(!id) return;
    var el = document.querySelector('[data-cid="'+id+'"]');
    if(el){
      el.style.outline='2px solid rgba(99,102,241,0.85)';
      el.style.outlineOffset='0px';
      el.style.transition='outline 0.15s ease';
    }
  }
  // Click on a section → notify parent
  document.querySelectorAll('.__ir').forEach(function(block){
    block.addEventListener('click',function(e){
      var id = block.getAttribute('data-cid');
      window.parent.postMessage({type:'ir-click',componentId:id},'*');
      selected = id;
      highlight(id);
      e.stopPropagation();
    });
    // Hover outline
    block.addEventListener('mouseenter',function(){
      if(selected===block.getAttribute('data-cid')) return;
      block.style.outline='1px dashed rgba(99,102,241,0.35)';
      block.style.outlineOffset='0px';
    });
    block.addEventListener('mouseleave',function(){
      if(selected===block.getAttribute('data-cid')) return;
      block.style.outline='';
    });
  });
  // Parent → highlight message
  window.addEventListener('message',function(e){
    if(!e.data||e.data.type!=='ir-highlight') return;
    selected = e.data.componentId||null;
    highlight(selected);
    if(selected){
      var el=document.querySelector('[data-cid="'+selected+'"]');
      if(el) el.scrollIntoView({behavior:'smooth',block:'nearest'});
    }
  });
})();
</script>`;

export function renderIRToCode(ir: TemplateIR): GeneratedFiles {
    const tokens = ir.styleTokens;
    const page = ir.pages[0];
    if (!page) return { files: [], framework: "HTML", summary: "페이지 없음" };

    const components = [...page.components]
        .sort((a, b) => a.order - b.order);

    const googleFont = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(tokens.fonts.heading)}:wght@400;600;700;800&family=${encodeURIComponent(tokens.fonts.body)}:wght@400;500;600&display=swap`;

    const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${ir.name}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${googleFont}" rel="stylesheet">
  <style>
${generateCSS(tokens)}
  </style>
</head>
<body>
${components.map(renderComponent).join("\n")}
${IR_INTERACTION_SCRIPT}
</body>
</html>`;

    return {
        files: [{ path: "index.html", code: html, language: "html" }],
        framework: "HTML",
        summary: `IR 렌더링: ${ir.name} (${components.filter(c => c.visible).length}개 컴포넌트)`,
    };
}
