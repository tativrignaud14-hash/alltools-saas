import Link from "next/link";
import { freeRules } from "@/lib/plans";

export function FreemiumNotice({ heavy = false }: { heavy?: boolean }) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 text-sm">
      <div className="font-medium text-white">{heavy ? "Fonction avancee" : "Essai gratuit sans compte"}</div>
      <p className="mt-1 text-neutral-400">
        {heavy
          ? "Cette action est ideale pour un plan payant quand les fichiers sont gros ou que le traitement demande un provider."
          : `Tu peux tester sans compte : ${freeRules.dailyJobs} traitements/jour, ${freeRules.maxFileMb} MB max, fichiers gardes ${freeRules.retention}.`}
      </p>
      <Link href="/pricing" className="mt-3 inline-flex text-blue-300 hover:text-blue-200">
        Voir les limites et plans
      </Link>
    </div>
  );
}
