const plans = [
  ["Free", "0 EUR", "Image et PDF legers, fichiers temporaires, limites journalieres"],
  ["Pro", "A definir", "Historique, gros fichiers, worker media, priorite"],
  ["Business", "A definir", "Equipe, admin, API, volumes eleves"],
];

export default function PricingPage() {
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Pricing</h1>
        <p className="mt-4 text-neutral-400">Structure SaaS prete pour lancer une offre gratuite puis monetiser les usages lourds.</p>
      </section>
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map(([name, price, details]) => (
          <div key={name} className="rounded-lg border border-neutral-800 bg-neutral-900 p-5">
            <div className="text-xl font-semibold">{name}</div>
            <div className="mt-2 text-2xl">{price}</div>
            <p className="mt-4 text-sm text-neutral-400">{details}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
