import { getStore } from "@netlify/blobs";

// One shared, site-wide store for all of the app's data (carriers, loads,
// settings, invoices). Netlify provisions this automatically on deploy —
// no extra configuration needed once this is live on Netlify.
const STORE_NAME = "load-tracker-data";

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export default async (req) => {
  const store = getStore({ name: STORE_NAME });
  const url = new URL(req.url);
  const key = url.searchParams.get("key");

  if (req.method === "GET") {
    if (!key) return json({ error: "key is required" }, 400);
    const value = await store.get(key);
    return json({ value: value ?? null });
  }

  if (req.method === "POST") {
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return json({ error: "invalid JSON body" }, 400);
    }
    if (!body || !body.key) return json({ error: "key is required" }, 400);
    await store.set(body.key, body.value ?? "");
    return json({ ok: true });
  }

  if (req.method === "DELETE") {
    if (!key) return json({ error: "key is required" }, 400);
    await store.delete(key);
    return json({ ok: true });
  }

  return json({ error: "method not allowed" }, 405);
};
