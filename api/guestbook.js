import { head, put, download } from "@vercel/blob";

const BLOB_KEY = "guestbook.json";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const blob = await head(BLOB_KEY);
      if (!blob) return res.status(200).json([]);
      const data = await download(BLOB_KEY);
      const entries = await data.text().then(t => JSON.parse(t));
      return res.status(200).json(entries);
    } catch {
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
      const blob = await head(BLOB_KEY);
      if (blob) {
        const data = await download(BLOB_KEY);
        entries = await data.text().then(t => JSON.parse(t));
      }
    } catch {}

    entries.unshift({
      text: text.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;"),
      time: new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })
    });

    if (entries.length > 200) entries = entries.slice(0, 200);

    await put(BLOB_KEY, JSON.stringify(entries), { contentType: "application/json", allowOverwrite: true });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
