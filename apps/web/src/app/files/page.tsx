const rows = [
  ["Images", "Resultats temporaires", "2 h"],
  ["PDF", "Documents generes", "2 h"],
  ["Audio", "Worker requis", "-"],
  ["Video", "Worker requis", "-"],
];

export default function FilesPage() {
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Mes fichiers</h1>
        <p className="mt-4 text-neutral-400">Espace pret pour historique, renommage, suppression et telechargement des resultats.</p>
      </section>
      <div className="overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900">
        {rows.map(([type, state, retention]) => (
          <div key={type} className="grid grid-cols-3 gap-3 border-b border-neutral-800 px-4 py-3 text-sm last:border-b-0">
            <div className="font-medium">{type}</div>
            <div className="text-neutral-400">{state}</div>
            <div className="text-neutral-500">Retention {retention}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
