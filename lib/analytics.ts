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
  console.info("Analytics event", fullEvent);
}

export function exportEventsAsJson(): string {
  return JSON.stringify(events, null, 2);
}
