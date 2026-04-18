import { list, put } from "@vercel/blob";

const BLOB_KEY = "guestbook.json";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const { blobs } = await list({ prefix: BLOB_KEY, limit: 1 });
      if (!blobs || blobs.length === 0) return res.status(200).json([]);
      const data = await fetch(blobs[0].url).then(r => r.json());
      return res.status(200).json(data);
    } catch (e) {
      return res.status(200).json([]);
    }
  }

  if (req.method === "POST") {
    const { text } = req.body || {};
    if (!text || typeof text !== "string" || text.trim().length === 0 || text.length > 200) {
      return res.status(400).json({ error: "invalid" });
    }

    let entries = [];
    try {
      const { blobs } = await list({ prefix: BLOB_KEY, limit: 1 });
      if (blobs && blobs.length > 0) entries = await fetch(blobs[0].url).then(r => r.json());
    } catch {}

    entries.unshift({
      text: text.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;"),
      time: new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })
    });

    if (entries.length > 200) entries = entries.slice(0, 200);

    await put(BLOB_KEY, JSON.stringify(entries), { access: "public", contentType: "application/json", allowOverwrite: true });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
