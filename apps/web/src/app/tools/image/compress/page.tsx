import ImageUploader from "@/app/tools/image/ImageUploader";

export default function CompressPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white p-10">
      <h1 className="text-3xl font-bold mb-6">💨 Compresser une image</h1>
      <p className="text-gray-400 mb-8">
        Réduisez la taille d’une image sans perte de qualité visible.
      </p>
      <ImageUploader tool="compress" />
    </main>
  );
}
