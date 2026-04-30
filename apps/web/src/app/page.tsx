import Link from "next/link";
import type { CSSProperties } from "react";
import Hero3DScene from "./Hero3DScene";

const tools = [
  { href: "/tools/image", title: "Atelier image", cat: "Image", desc: "Convertir, compresser, preview, batch, IA.", accent: "#3b82f6", tone: "blue" },
  { href: "/tools/pdf", title: "Atelier PDF", cat: "PDF", desc: "Fusion, edition avancee, signature, preview.", accent: "#22c55e", tone: "green" },
  { href: "/tools/video", title: "Atelier video", cat: "Video", desc: "Conversion, GIF, decoupe, sous-titres.", accent: "#f59e0b", tone: "amber" },
  { href: "/tools/audio", title: "Atelier audio", cat: "Audio", desc: "Conversion, coupe, fusion, normalisation.", accent: "#ec4899", tone: "pink" },
  { href: "/dashboard", title: "Dashboard", cat: "SaaS", desc: "Quotas, historique, upgrade et etat.", accent: "#06b6d4", tone: "cyan" },
  { href: "/pricing", title: "Pricing", cat: "SaaS", desc: "Free, Starter, Pro, AI Pro, Business.", accent: "#a855f7", tone: "violet" },
];

const flow = ["Upload", "Preview", "Process", "Download"];
const liveChips = ["Image", "PDF", "Audio", "Video", "AI", "SaaS"];

export default function HomePage() {
  return (
    <div className="space-y-14">
      <section className="relative grid min-h-[calc(100vh-190px)] items-center gap-10 overflow-hidden rounded-[28px] border border-white/10 bg-black/25 px-5 py-10 shadow-2xl md:px-10 lg:grid-cols-[1fr_560px]">
        <div className="hero-color-bars" aria-hidden="true" />
        <div className="animate-rise relative z-10 max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1 text-sm text-neutral-200 shadow-lg">
            <span className="h-2 w-2 rounded-full bg-[#22c55e] shadow-[0_0_18px_rgba(34,197,94,0.95)]" />
            SaaS fichiers sans compte au premier usage
          </div>
          <h1 className="max-w-4xl text-5xl font-semibold leading-[1.02] tracking-tight text-white md:text-7xl">
            Tous tes fichiers, traites en un seul endroit.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-400">
            Image, PDF, audio, video et espace SaaS avec previews, drag and drop, resultats automatiques et tunnel
            freemium pret a convertir.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/tools/image" className="interactive-button rounded-lg bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-blue-200">
              Lancer un outil
            </Link>
            <Link href="/pricing" className="interactive-button rounded-lg border border-white/15 bg-white/[0.08] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/14">
              Voir les plans
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            {liveChips.map((chip, index) => (
              <span key={chip} className="kinetic-chip" style={{ animationDelay: `${index * 120}ms` }}>
                {chip}
              </span>
            ))}
          </div>
        </div>

        <div className="hero-3d-shell animate-rise-delay relative min-h-[520px] overflow-hidden rounded-[24px] border border-white/10 bg-black/35">
          <Hero3DScene />
          <div className="pointer-events-none absolute inset-x-4 top-4 z-10 flex items-center justify-between rounded-lg border border-white/10 bg-black/42 px-4 py-3 backdrop-blur-md">
            <div>
              <div className="text-sm text-neutral-400">Live 3D workspace</div>
              <div className="text-lg font-semibold">alltools.pipeline</div>
            </div>
            <div className="rounded-full border border-[#22c55e]/50 bg-[#22c55e]/10 px-3 py-1 text-xs text-[#86efac]">Rendering</div>
          </div>

          <div className="absolute inset-x-4 bottom-4 z-10 grid gap-3">
            {flow.map((item, index) => (
              <div key={item} className="rounded-lg border border-white/10 bg-black/45 p-4 backdrop-blur-md">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium">{item}</span>
                  <span className="text-xs text-neutral-400">0{index + 1}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="motion-line h-full rounded-full"
                    style={{
                      width: `${48 + index * 12}%`,
                      background: index === 1 ? "#27d17f" : index === 2 ? "#f5b84b" : "#2f6bff",
                      animationDelay: `${index * 220}ms`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="animate-rise-delay">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Workspaces</h2>
            <p className="mt-2 text-sm text-neutral-500">Des outils rapides, visuels et prets pour la monetisation.</p>
          </div>
          <Link href="/dashboard" className="hidden text-sm text-neutral-400 transition hover:text-white md:block">
            Ouvrir le dashboard
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className={`tool-card color-card color-card-${tool.tone} rounded-lg p-5`}
              style={{ "--accent": tool.accent } as CSSProperties}
            >
              <div className="text-xs uppercase text-neutral-500">{tool.cat}</div>
              <div className="mt-3 text-xl font-semibold">{tool.title}</div>
              <p className="mt-3 text-sm leading-6 text-neutral-400">{tool.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
