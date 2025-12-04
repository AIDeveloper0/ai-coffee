export type PastryUpsert = {
  id: string;
  name: string;
  origin: string;
  price: number;
  currency: "EUR";
  notableDescription: string;
  tastingNotes: string[];
  image?: string;
};

export type ShopInfo = {
  name: string;
  logo?: string;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function postSupabase(path: string, body: Record<string, any>) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.warn("Supabase sync failed", res.status, await res.text());
    }
  } catch (err) {
    console.warn("Supabase sync error", err);
  }
}

export async function syncPastryToSupabase(pastry: PastryUpsert) {
  await postSupabase("pastries", [pastry]);
}

export async function syncShopInfoToSupabase(info: ShopInfo) {
  await postSupabase("shop_info", [info]);
}
