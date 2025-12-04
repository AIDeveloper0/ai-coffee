export interface AnalyticsEvent {
  id: string;
  type: "coffee_selected" | "pairings_requested" | "pastry_clicked" | "add_to_cart" | "checkout";
  coffeeId?: string;
  pastryId?: string;
  pastryIds?: string[];
  metadata?: Record<string, any>;
  sessionId: string;
  timestamp: string;
}

export const events: AnalyticsEvent[] = [];

const SESSION_KEY = "ai-coffee-session";
const EVENTS_KEY = "ai-coffee-events";

function loadEvents() {
  if (typeof window === "undefined") return;
  const raw = window.localStorage.getItem(EVENTS_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as AnalyticsEvent[];
      events.splice(0, events.length, ...parsed);
    } catch {
      // ignore parse errors
    }
  }
}

if (typeof window !== "undefined") {
  loadEvents();
}

export function getSessionId(): string {
  if (typeof window === "undefined") return "server-session";
  const existing = window.localStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const sessionId = crypto.randomUUID();
  window.localStorage.setItem(SESSION_KEY, sessionId);
  return sessionId;
}

export function logEvent(event: Omit<AnalyticsEvent, "id" | "sessionId" | "timestamp">): void {
  const fullEvent: AnalyticsEvent = {
    ...event,
    id: crypto.randomUUID(),
    sessionId: getSessionId(),
    timestamp: new Date().toISOString(),
  };
  events.push(fullEvent);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  }
  console.info("Analytics event", fullEvent);
}

export function exportEventsAsJson(): string {
  return JSON.stringify(events, null, 2);
}

export function exportEventsAsCsv(): string {
  const headers = ["id", "type", "coffeeId", "pastryId", "pastryIds", "sessionId", "timestamp"];
  const rows = events.map((e) =>
    [
      e.id,
      e.type,
      e.coffeeId ?? "",
      e.pastryId ?? "",
      e.pastryIds ? e.pastryIds.join("|") : "",
      e.sessionId,
      e.timestamp,
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}
