import type { NextApiRequest, NextApiResponse } from "next";
import { getQueue } from "@/lib/queue";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { type, data } = req.body ?? {};
    if (!type) {
      return res.status(400).json({ error: "Type manquant" });
    }

    const job = await getQueue().add(type, data || {});
    return res.status(200).json({ ok: true, id: job.id });
  } catch {
    return res.status(500).json({ error: "Erreur d'envoi du job" });
  }
}
