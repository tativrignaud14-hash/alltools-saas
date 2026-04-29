import ImageUploader from "@/app/tools/image/ImageUploader";

export default function RemoveBgPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white p-10">
      <h1 className="text-3xl font-bold mb-6">🪄 Supprimer l’arrière-plan</h1>
      <p className="text-gray-400 mb-8">
        Téléversez une image et laissez l’IA retirer automatiquement le fond.
      </p>
      <ImageUploader tool="remove-bg" />
    </main>
  );
}
