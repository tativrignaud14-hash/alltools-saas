import Link from "next/link";

const tools = [
  { href: "/tools/image", title: "Atelier image complet", cat: "Image" },
  { href: "/video/extract-audio", title: "Extraire l'audio d'une video", cat: "Video" },
  { href: "/pdf/merge", title: "Fusionner PDF", cat: "PDF" },
];

export default function HomePage() {
  return (
    <div>
      <h1 className="text-3xl font-semibold mb-6">Boite a outils fichiers</h1>
      <p className="text-gray-400 mb-8">
        Upload direct S3/R2, traitement cote worker, resultats prets a telecharger.
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
