import Link from "next/link";
import type { CSSProperties } from "react";
import Hero3DScene from "./Hero3DScene";

const palette = [
  ["Bleu", "#2563EB"],
  ["Violet", "#7C3AED"],
  ["Corail", "#FF4D5A"],
  ["Ambre", "#FFB84D"],
  ["Teal", "#14B8A6"],
];

const tools = [
  { href: "/tools/image", title: "Photo", desc: "Retouche, IA, formats", accent: "#2563EB", icon: "image" },
  { href: "/tools/pdf", title: "PDF", desc: "Fusion, edition, signature", accent: "#FF4D5A", icon: "pdf" },
  { href: "/tools/video", title: "Video", desc: "GIF, decoupe, export", accent: "#7C3AED", icon: "play" },
  { href: "/tools/audio", title: "Audio", desc: "Coupe, fusion, volume", accent: "#14B8A6", icon: "audio" },
  { href: "/dashboard", title: "SaaS", desc: "Quotas, fichiers, plans", accent: "#FFB84D", icon: "cloud" },
];

export default function HomePage() {
  return (
    <div className="full-bleed-home">
      <section className="home-stage">
        <div className="stage-grid" aria-hidden="true" />

        <div className="stage-copy animate-rise">
          <div className="hero-logo-lockup" aria-label="AllTools">
            <img src="/brand/alltools-mark.svg" alt="" width="72" height="72" />
            <div>
              <strong>ALLTOOLS</strong>
              <span>
                Editez tout. <em>Simplement.</em>
              </span>
            </div>
          </div>

          <div className="brand-strip">
            {palette.map(([name, color]) => (
              <span key={name} style={{ "--swatch": color } as CSSProperties}>
                {name}
              </span>
            ))}
          </div>

          <p className="stage-kicker">AllTools OS</p>
          <h1>Edite tout, dans un espace visuel ultra rapide.</h1>
          <p className="stage-subtitle">
            Image, PDF, audio et video dans une interface plein ecran, avec drag and drop, previews, traitement local quand c'est possible et resultat automatique.
          </p>

          <div className="brand-benefits" aria-label="Avantages AllTools">
            <span>
              <b>Rapide</b>
              Fichiers prets en quelques secondes.
            </span>
            <span>
              <b>Securise</b>
              Donnees privees, suppression automatique.
            </span>
            <span>
              <b>Simple</b>
              Sans installation, tous appareils.
            </span>
          </div>

          <div className="stage-actions">
            <Link href="/tools/image" className="primary-action">
              Commencer
            </Link>
            <Link href="/dashboard" className="secondary-action">
              Dashboard
            </Link>
          </div>
        </div>

        <div className="stage-orbit-wrap animate-rise-delay" aria-hidden="true">
          <div className="stage-orbit-mask">
            <Hero3DScene />
          </div>
        </div>

        <nav className="tool-dock animate-rise-delay" aria-label="Workspaces">
          {tools.map((tool) => (
            <Link key={tool.href} href={tool.href} className="dock-item" style={{ "--accent": tool.accent } as CSSProperties}>
              <ToolIcon type={tool.icon} />
              <span>{tool.title}</span>
              <small>{tool.desc}</small>
            </Link>
          ))}
        </nav>
      </section>
    </div>
  );
}

function ToolIcon({ type }: { type: string }) {
  return (
    <span className="dock-icon" aria-hidden="true">
      {type === "image" && (
        <svg viewBox="0 0 24 24">
          <path d="M4 17.5 9.4 12l3.2 3.1 2-2.1L20 18.5" />
          <path d="M5 5h14v14H5z" />
          <circle cx="16.5" cy="8.5" r="1.4" />
        </svg>
      )}
      {type === "pdf" && (
        <svg viewBox="0 0 24 24">
          <path d="M7 3h7l4 4v14H7z" />
          <path d="M14 3v5h5" />
          <path d="M9.5 14h5" />
          <path d="M9.5 17h3" />
        </svg>
      )}
      {type === "play" && (
        <svg viewBox="0 0 24 24">
          <path d="M8 5.8v12.4L18 12z" />
        </svg>
      )}
      {type === "audio" && (
        <svg viewBox="0 0 24 24">
          <path d="M6 14h3l5 4V6l-5 4H6z" />
          <path d="M17 9.5a4 4 0 0 1 0 5" />
          <path d="M19.5 7a7.5 7.5 0 0 1 0 10" />
        </svg>
      )}
      {type === "cloud" && (
        <svg viewBox="0 0 24 24">
          <path d="M7 18h10a4 4 0 0 0 0-8 6 6 0 0 0-11.5 1.6A3.3 3.3 0 0 0 7 18z" />
          <path d="M12 15V9" />
          <path d="m9.5 11.5 2.5-2.5 2.5 2.5" />
        </svg>
      )}
    </span>
  );
}
