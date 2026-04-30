import Link from "next/link";
import { freeRules } from "@/lib/plans";

const rows = [
  ["Images", "Telechargement direct", freeRules.retention, "Free"],
  ["PDF", "Edition et export direct", freeRules.retention, "Free"],
  ["Audio", "Worker FFmpeg requis", "30 jours avec Pro", "Pro"],
  ["Video", "Worker FFmpeg requis", "30 jours avec Pro", "Pro"],
  ["IA / OCR", "Provider requis", "30 jours avec AI Pro", "AI Pro"],
];

export default function FilesPage() {
  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Mes fichiers</h1>
          <p className="mt-4 max-w-4xl text-neutral-400">
            Sans compte, les fichiers restent temporaires. Avec un compte, cette page devient l'historique personnel :
            renommer, retrouver, supprimer et telecharger les resultats.
          </p>
        </div>
        <Link href="/pricing" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          Garder mes fichiers
        </Link>
      </section>

      <div className="overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900">
        <div className="grid grid-cols-4 gap-3 border-b border-neutral-800 px-4 py-3 text-xs uppercase text-neutral-500">
          <div>Type</div>
          <div>Etat</div>
          <div>Retention</div>
          <div>Plan</div>
        </div>
        {rows.map(([type, state, retention, plan]) => (
          <div key={type} className="grid grid-cols-4 gap-3 border-b border-neutral-800 px-4 py-3 text-sm last:border-b-0">
            <div className="font-medium">{type}</div>
            <div className="text-neutral-400">{state}</div>
            <div className="text-neutral-500">{retention}</div>
            <div className="text-neutral-300">{plan}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
