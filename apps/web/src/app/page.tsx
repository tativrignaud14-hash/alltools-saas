import Link from "next/link";
import type { CSSProperties } from "react";
import Hero3DScene from "./Hero3DScene";

const palette = [
  ["Cyan", "#00e5ff"],
  ["Lime", "#d8ff4f"],
  ["Coral", "#ff5a5f"],
  ["Violet", "#7c5cff"],
];

const tools = [
  { href: "/tools/image", title: "Image", desc: "Convertir, compresser, IA", accent: "#00e5ff" },
  { href: "/tools/pdf", title: "PDF", desc: "Fusion, edition, signature", accent: "#d8ff4f" },
  { href: "/tools/video", title: "Video", desc: "GIF, decoupe, export", accent: "#ffb000" },
  { href: "/tools/audio", title: "Audio", desc: "Coupe, fusion, volume", accent: "#ff5a5f" },
  { href: "/dashboard", title: "SaaS", desc: "Quotas, fichiers, plans", accent: "#7c5cff" },
];

export default function HomePage() {
  return (
    <div className="full-bleed-home">
      <section className="home-stage">
        <div className="stage-grid" aria-hidden="true" />

        <div className="stage-copy animate-rise">
          <div className="brand-strip">
            {palette.map(([name, color]) => (
              <span key={name} style={{ "--swatch": color } as CSSProperties}>
                {name}
              </span>
            ))}
          </div>

          <p className="stage-kicker">AllTools OS</p>
          <h1>Une interface nette pour traiter tous tes fichiers.</h1>
          <p className="stage-subtitle">
            Image, PDF, audio et video dans un espace plein ecran, visuel, rapide, avec previews et resultat automatique.
          </p>

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
              <span>{tool.title}</span>
              <small>{tool.desc}</small>
            </Link>
          ))}
        </nav>
      </section>
    </div>
  );
}
