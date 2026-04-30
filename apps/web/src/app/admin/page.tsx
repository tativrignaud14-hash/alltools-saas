const checks = [
  ["Vercel", "Actif"],
  ["Supabase Storage", "Configure"],
  ["Redis", "Optionnel pour files"],
  ["Worker FFmpeg", "A brancher"],
  ["Providers IA/OCR", "A brancher"],
];

export default function AdminPage() {
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Admin</h1>
        <p className="mt-4 text-neutral-400">Vue interne pour suivre les services, quotas, providers et etat des outils.</p>
      </section>
      <div className="rounded-lg border border-neutral-800 bg-neutral-900">
        {checks.map(([name, state]) => (
          <div key={name} className="flex items-center justify-between border-b border-neutral-800 px-4 py-3 text-sm last:border-b-0">
            <span>{name}</span>
            <span className="text-neutral-400">{state}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
