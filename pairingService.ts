import type { Coffee, Pastry } from "@/data";

export interface PairingResult {
  pastry: Pastry;
  reason: string;
}

export type AnalyticsEvent = {
  type: string;
  coffeeId: string;
  pastryIds: string[];
  timestamp: string;
};

export const analyticsEvents: AnalyticsEvent[] = [];

const MODEL = "gpt-4o-mini";

function buildPrompt(coffee: Coffee, pastries: Pastry[]): string {
  const pastryList = pastries
    .map(
      (p) =>
        `${p.id}: ${p.name} — price ${p.price.toFixed(2)} ${p.currency}; ${p.notableDescription}; notes ${p.tastingNotes.join(", ")}`
    )
    .join("\n");

  return [
    "You are a barista pairing assistant. Given one coffee and a list of pastries, return the best 2–3 pastry pairings.",
    "Use JSON only (no markdown), shape: [{\"pastryId\": string, \"reason\": string}].",
    "Consider flavor contrast/complement, texture, sweetness, and cultural fit.",
    "",
    `Coffee: ${coffee.name} | origin: ${coffee.origin} | notes: ${coffee.tastingNotes.join(", ")}`,
    "",
    "Pastries:",
    pastryList,
  ].join("\n");
}

async function fetchFromOpenAI(prompt: string, apiKey: string) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<{
    choices: { message?: { content?: string } }[];
  }>;
}

function parsePairings(content: string | undefined) {
  if (!content) return [];
  try {
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed)) return [];
    return parsed as { pastryId: string; reason: string }[];
  } catch {
    return [];
  }
}

function mockPairings(coffee: Coffee, pastries: Pastry[]): PairingResult[] {
  const map = Object.fromEntries(pastries.map((p) => [p.id, p]));
  const isSweetspot = coffee.id === "sweetspot-standard";

  const ids = isSweetspot
    ? ["franzbrotchen", "pain-au-chocolat", "banana-bread"]
    : ["croissant", "zimtknoten", "kardamomknoten"];

  return ids
    .map((id) => map[id])
    .filter(Boolean)
    .map((pastry) => ({
      pastry,
      reason: isSweetspot
        ? "Caramel and spice play well with the blend’s chocolate-hazelnut notes."
        : "Butter and warm spice cushion bright berry acidity.",
    }));
}

function logPairingEvent(coffee: Coffee, results: PairingResult[]) {
  const payload = {
    type: "pairing_generated",
    timestamp: new Date().toISOString(),
    coffeeId: coffee.id,
    pastryIds: results.map((p) => p.pastry.id),
    pastryNames: results.map((p) => p.pastry.name),
    tastingNotes: coffee.tastingNotes,
  };
  analyticsEvents.push({
    type: payload.type,
    timestamp: payload.timestamp,
    coffeeId: payload.coffeeId,
    pastryIds: payload.pastryIds,
  });
  console.log("[analytics]", payload);
}

export async function getPairings(
  coffee: Coffee,
  pastries: Pastry[],
  contextNote?: string
): Promise<PairingResult[]> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    const fallback = mockPairings(coffee, pastries);
    logPairingEvent(coffee, fallback);
    return fallback;
  }

  try {
    const prompt = buildPrompt(
      { ...coffee, tastingNotes: contextNote ? [...coffee.tastingNotes, contextNote] : coffee.tastingNotes },
      pastries
    );
    const data = await fetchFromOpenAI(prompt, apiKey);
    const raw = parsePairings(data.choices?.[0]?.message?.content);

    const pastryById = new Map(pastries.map((p) => [p.id, p]));
    const results: PairingResult[] = raw
      .map(({ pastryId, reason }) => {
        const pastry = pastryById.get(pastryId);
        if (!pastry || !reason) return null;
        return { pastry, reason };
      })
      .filter((item): item is PairingResult => Boolean(item));

    if (results.length === 0) {
      const fallback = mockPairings(coffee, pastries);
      logPairingEvent(coffee, fallback);
      return fallback;
    }

    logPairingEvent(coffee, results);
    return results;
  } catch (error) {
    console.error("Pairing error", error);
    const fallback = mockPairings(coffee, pastries);
    logPairingEvent(coffee, fallback);
    return fallback;
  }
}
