import Link from "next/link";

const tools = [
  { href: "/tools/image", title: "Atelier image complet", cat: "Image" },
  { href: "/tools/video", title: "Atelier video complet", cat: "Video" },
  { href: "/tools/audio", title: "Atelier audio complet", cat: "Audio" },
  { href: "/tools/pdf", title: "Atelier PDF complet", cat: "PDF" },
  { href: "/dashboard", title: "Tableau de bord SaaS", cat: "SaaS" },
  { href: "/files", title: "Mes fichiers", cat: "SaaS" },
  { href: "/pricing", title: "Pricing", cat: "SaaS" },
  { href: "/admin", title: "Admin", cat: "SaaS" },
];

export default function HomePage() {
  return (
    <div>
      <h1 className="text-3xl font-semibold mb-6">Boite a outils fichiers</h1>
      <p className="text-gray-400 mb-8">
        Image, PDF, audio, video et espace SaaS avec resultats prets a telecharger.
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        {tools.map((tool) => (
          <Link key={tool.href} href={tool.href} className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 hover:bg-neutral-800">
            <div className="text-xs uppercase text-gray-500">{tool.cat}</div>
            <div className="font-medium">{tool.title}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
