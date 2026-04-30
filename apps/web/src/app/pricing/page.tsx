import { plans } from "@/lib/plans";

export default function PricingPage() {
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Pricing</h1>
        <p className="mt-4 max-w-4xl text-neutral-400">
          Un modele freemium sans friction : les visiteurs testent sans compte, puis le compte devient utile pour
          garder les fichiers, lever les limites et utiliser les outils lourds.
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => (
          <section
            key={plan.name}
            className={`rounded-lg border p-5 ${
              plan.name === "Pro" ? "border-blue-500 bg-blue-950/30" : "border-neutral-800 bg-neutral-900"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">{plan.name}</h2>
              <span className="rounded-full border border-neutral-700 px-3 py-1 text-xs text-neutral-300">{plan.badge}</span>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-semibold">{plan.price}</span>
              <span className="ml-2 text-sm text-neutral-500">{plan.cadence}</span>
            </div>
            <p className="mt-3 text-sm text-neutral-400">{plan.audience}</p>
            <ul className="mt-5 space-y-2 text-sm text-neutral-300">
              {plan.limits.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
            <button className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700">
              {plan.cta}
            </button>
          </section>
        ))}
      </div>

      <section className="rounded-lg border border-neutral-800 bg-neutral-900 p-5">
        <h2 className="text-xl font-semibold">Regle de conversion</h2>
        <p className="mt-3 text-sm text-neutral-400">
          Pas de compte obligatoire au premier usage. Le compte est demande seulement au moment ou il apporte une valeur :
          historique, gros fichiers, batch avance, IA, audio/video ou espace equipe.
        </p>
      </section>
    </div>
  );
}
