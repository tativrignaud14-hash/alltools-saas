const stats = [
  ["Traitements aujourd'hui", "0 / 25"],
  ["Stockage temporaire", "2 h"],
  ["Outils actifs", "Image, PDF, Audio, Video"],
  ["Plan", "Free"],
];

const recent = [
  "Conversion image",
  "Fusion PDF",
  "Edition PDF avancee",
  "Compression image",
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Tableau de bord</h1>
        <p className="mt-4 text-neutral-400">Suivi des traitements, limites gratuites, fichiers recents et etat de la plateforme.</p>
      </section>
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
            <div className="text-xs uppercase text-neutral-500">{label}</div>
            <div className="mt-2 text-xl font-semibold">{value}</div>
          </div>
        ))}
      </div>
      <section className="rounded-lg border border-neutral-800 bg-neutral-900 p-5">
        <h2 className="text-xl font-semibold">Historique</h2>
        <div className="mt-4 grid gap-2">
          {recent.map((item) => (
            <div key={item} className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-300">
              {item} - pret a telecharger
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
