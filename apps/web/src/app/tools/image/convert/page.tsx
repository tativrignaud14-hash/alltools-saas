import ImageUploader from "@/app/tools/image/ImageUploader";

export default function ConvertPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white p-10">
      <h1 className="text-3xl font-bold mb-6">🔄 Convertir une image</h1>
      <p className="text-gray-400 mb-8">
        Convertissez vos images entre les formats PNG, JPG et WEBP.
      </p>
      <ImageUploader tool="convert" />
    </main>
  );
}
