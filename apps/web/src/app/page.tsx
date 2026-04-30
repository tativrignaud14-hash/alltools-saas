import Link from "next/link";
import type { CSSProperties } from "react";

const tools = [
  { href: "/tools/image", title: "Atelier image", cat: "Image", desc: "Convertir, compresser, preview, batch, IA.", accent: "#2f6bff" },
  { href: "/tools/pdf", title: "Atelier PDF", cat: "PDF", desc: "Fusion, edition avancee, signature, preview.", accent: "#27d17f" },
  { href: "/tools/video", title: "Atelier video", cat: "Video", desc: "Conversion, GIF, decoupe, sous-titres.", accent: "#f5b84b" },
  { href: "/tools/audio", title: "Atelier audio", cat: "Audio", desc: "Conversion, coupe, fusion, normalisation.", accent: "#ff5c7a" },
  { href: "/dashboard", title: "Dashboard", cat: "SaaS", desc: "Quotas, historique, upgrade et etat.", accent: "#8bd3ff" },
  { href: "/pricing", title: "Pricing", cat: "SaaS", desc: "Free, Starter, Pro, AI Pro, Business.", accent: "#ffffff" },
];

const flow = ["Upload", "Preview", "Process", "Download"];

export default function HomePage() {
  return (
    <div className="space-y-14">
      <section className="grid min-h-[calc(100vh-220px)] items-center gap-10 lg:grid-cols-[1fr_520px]">
        <div className="animate-rise max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-sm text-neutral-300">
            <span className="h-2 w-2 rounded-full bg-[#27d17f]" />
            SaaS fichiers sans compte au premier usage
          </div>
          <h1 className="text-5xl font-semibold leading-[1.02] tracking-tight text-white md:text-7xl">
            Tous tes fichiers, traites en un seul endroit.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-400">
            Image, PDF, audio, video et espace SaaS avec previews, drag and drop, resultats automatiques et tunnel
            freemium pret a convertir.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/tools/image" className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-blue-200">
              Lancer un outil
            </Link>
            <Link href="/pricing" className="rounded-lg border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
              Voir les plans
            </Link>
          </div>
        </div>

        <div className="visual-panel floating animate-rise-delay rounded-lg p-5">
          <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <div className="text-sm text-neutral-500">Live workspace</div>
              <div className="text-lg font-semibold">alltools.pipeline</div>
            </div>
            <div className="rounded-full border border-[#27d17f]/40 px-3 py-1 text-xs text-[#27d17f]">Ready</div>
          </div>

          <div className="grid gap-3">
            {flow.map((item, index) => (
              <div key={item} className="rounded-lg border border-white/10 bg-black/30 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium">{item}</span>
                  <span className="text-xs text-neutral-500">0{index + 1}</span>
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

          <div className="mt-4 grid grid-cols-3 gap-3">
            {["IMG", "PDF", "AI"].map((item) => (
              <div key={item} className="rounded-lg border border-white/10 bg-white/[0.04] p-3 text-center text-sm font-semibold">
                {item}
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
              className="tool-card rounded-lg p-5"
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
