import MediaUploader from "../media/MediaUploader";
import { FreemiumNotice } from "@/components/FreemiumNotice";

export default function AudioToolsPage() {
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Atelier audio complet</h1>
        <p className="mt-4 max-w-4xl text-neutral-400">
          Conversion, compression, decoupe, fusion, normalisation, silence et outils IA audio.
        </p>
      </section>
      <FreemiumNotice heavy />
      <MediaUploader kind="audio" />
    </div>
  );
}
