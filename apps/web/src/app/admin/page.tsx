import { plans } from "@/lib/plans";

const checks = [
  ["Vercel", "Actif", "Heberge l'app et les jobs Image/PDF legers"],
  ["Supabase Storage", "Configure", "Stockage temporaire des fichiers"],
  ["Redis", "Optionnel", "File d'attente si worker externe"],
  ["Stripe", "A brancher", "Abonnements Starter/Pro/AI Pro/Business"],
  ["Auth", "A brancher", "Comptes pour historique et equipes"],
  ["Worker FFmpeg", "A brancher", "Audio/video Pro"],
  ["Providers IA/OCR", "A brancher", "AI Pro"],
];

export default function AdminPage() {
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Admin</h1>
        <p className="mt-4 max-w-4xl text-neutral-400">
          Vue interne pour piloter les services, les plans, les quotas et les providers a brancher.
        </p>
      </section>

      <div className="rounded-lg border border-neutral-800 bg-neutral-900">
        {checks.map(([name, state, detail]) => (
          <div key={name} className="grid gap-2 border-b border-neutral-800 px-4 py-3 text-sm last:border-b-0 md:grid-cols-[160px_120px_1fr]">
            <span className="font-medium">{name}</span>
            <span className="text-neutral-300">{state}</span>
            <span className="text-neutral-500">{detail}</span>
          </div>
        ))}
      </div>

      <section className="rounded-lg border border-neutral-800 bg-neutral-900 p-5">
        <h2 className="text-xl font-semibold">Plans actifs</h2>
        <div className="mt-4 grid gap-2 md:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.name} className="rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-sm">
              <div className="font-medium">{plan.name}</div>
              <div className="text-neutral-400">{plan.price} - {plan.cadence}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
