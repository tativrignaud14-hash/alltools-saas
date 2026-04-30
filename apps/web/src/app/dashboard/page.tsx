import Link from "next/link";
import { freeRules, plans } from "@/lib/plans";

const stats = [
  ["Plan actuel", "Free"],
  ["Traitements gratuits", `0 / ${freeRules.dailyJobs} aujourd'hui`],
  ["Taille max gratuite", `${freeRules.maxFileMb} MB`],
  ["Retention fichiers", freeRules.retention],
];

const upgradeTriggers = [
  ["Creer un compte", "Garder l'historique et retrouver ses fichiers"],
  ["Passer Starter", "Augmenter les limites pour un usage regulier"],
  ["Passer Pro", "Debloquer audio/video avec worker FFmpeg"],
  ["Passer AI Pro", "Debloquer OCR, resume, chat PDF et outils IA"],
];

export default function DashboardPage() {
  const pro = plans.find((plan) => plan.name === "Pro");

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Tableau de bord</h1>
          <p className="mt-4 max-w-4xl text-neutral-400">
            Centre de controle SaaS : quotas, historique, upgrade et etat des services. Le visiteur peut tester sans
            compte, puis creer un compte quand il veut garder ses fichiers.
          </p>
        </div>
        <Link href="/pricing" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          Voir les plans
        </Link>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
            <div className="text-xs uppercase text-neutral-500">{label}</div>
            <div className="mt-2 text-xl font-semibold">{value}</div>
          </div>
        ))}
      </div>

      <section className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-5">
          <h2 className="text-xl font-semibold">Tunnel recommande</h2>
          <div className="mt-4 grid gap-3">
            {upgradeTriggers.map(([title, detail], index) => (
              <div key={title} className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-3 text-sm">
                <div className="text-neutral-500">Etape {index + 1}</div>
                <div className="font-medium">{title}</div>
                <div className="text-neutral-400">{detail}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-blue-500 bg-blue-950/30 p-5">
          <div className="text-xs uppercase text-blue-200">Plan conseille</div>
          <h2 className="mt-2 text-2xl font-semibold">{pro?.name}</h2>
          <p className="mt-2 text-sm text-neutral-300">{pro?.price} / mois pour les utilisateurs qui veulent les outils lourds.</p>
          <Link href="/pricing" className="mt-5 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Upgrade
          </Link>
        </div>
      </section>
    </div>
  );
}
