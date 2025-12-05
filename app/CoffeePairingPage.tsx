
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { coffees, pastries } from "@/data";
import type { Coffee, Pastry } from "@/data";
import { analyticsEvents, getPairings, type PairingResult } from "@/pairingService";
import { logEvent } from "@/lib/analytics";
import styles from "./page.module.css";

type PairingInsight = {
  matches: string[];
  complements: string[];
};

function buildInsights(coffee: Coffee | undefined, pastry: Pastry): PairingInsight {
  if (!coffee) {
    return { matches: [], complements: pastry.tastingNotes };
  }
  const matches = pastry.tastingNotes.filter((note) =>
    coffee.tastingNotes.some((coffeeNote) => {
      const a = coffeeNote.toLowerCase();
      const b = note.toLowerCase();
      return a.includes(b) || b.includes(a);
    })
  );
  const complements = pastry.tastingNotes.filter((note) => !matches.includes(note));
  return { matches, complements };
}

function formatTotal(total: number) {
  return `${total.toFixed(2)} EUR`;
}

function getInitials(name: string) {
  const parts = name.split(" ").filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export default function CoffeePairingPage() {
  const [coffeeList] = useState(coffees);
  const [pastryList, setPastryList] = useState(pastries);
  const [availability, setAvailability] = useState<Record<string, boolean>>(
    () => Object.fromEntries(pastries.map((p) => [p.id, true]))
  );
  const [selectedCoffeeId, setSelectedCoffeeId] = useState<string>(coffees[0]?.id ?? "");
  const [freeTextCoffee, setFreeTextCoffee] = useState("");
  const [pairingStyle, setPairingStyle] = useState<"balanced" | "contrast" | "complement">("balanced");
  const [pairings, setPairings] = useState<PairingResult[]>([]);
  const [pairingSnapshot, setPairingSnapshot] = useState<
    | {
        coffee: string;
        pairing: { pastry: string; reason: string }[];
      }
    | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [cart, setCart] = useState<{ pastryId: string; quantity: number }[]>([]);
  const [orderMessage, setOrderMessage] = useState<string | null>(null);
  const [lastDurationMs, setLastDurationMs] = useState<number | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  const [newPastry, setNewPastry] = useState({
    name: "",
    origin: "",
    price: "",
    notableDescription: "",
    category: "",
  });

  const [shopName, setShopName] = useState("Sweet Spot Coffee Roasters");
  const [shopLogo, setShopLogo] = useState("");

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const requestIdRef = useRef(0);

  const selectedCoffee: Coffee | undefined = useMemo(
    () => coffeeList.find((c) => c.id === selectedCoffeeId),
    [coffeeList, selectedCoffeeId]
  );

  const activeMenu = useMemo(
    () => pastryList.filter((p) => availability[p.id] !== false),
    [availability, pastryList]
  );

  const cartTotal = useMemo(
    () =>
      cart.reduce((sum, item) => {
        const pastry = pastryList.find((p) => p.id === item.pastryId);
        return sum + (pastry ? pastry.price * item.quantity : 0);
      }, 0),
    [cart, pastryList]
  );

  const flowSteps = useMemo(
    () => [
      {
        label: "Input ready",
        value: selectedCoffee?.name ?? "Pick a coffee",
        done: Boolean(selectedCoffeeId),
      },
      {
        label: "Pairing output",
        value: isLoading ? "Brewing..." : pairings.length > 0 ? `${pairings.length} options` : "Awaiting request",
        done: pairings.length > 0,
      },
      {
        label: "Cart",
        value: cart.length > 0 ? `${cart.length} item(s) | ${formatTotal(cartTotal)}` : "Empty",
        done: cart.length > 0,
      },
      {
        label: "Checkout",
        value: orderMessage ? "Confirmed" : "Ready when you are",
        done: Boolean(orderMessage),
      },
    ],
    [cart.length, cartTotal, isLoading, orderMessage, pairings.length, selectedCoffee?.name, selectedCoffeeId]
  );

  const pairingsWithInsight = useMemo(
    () => pairings.map((item) => ({ ...item, insight: buildInsights(selectedCoffee, item.pastry) })),
    [pairings, selectedCoffee]
  );

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const handleGetPairings = async () => {
    if (!selectedCoffee) return;
    if (activeMenu.length === 0) {
      setError("No pastries are active. Toggle items on in the admin panel.");
      return;
    }
    const runId = requestIdRef.current + 1;
    requestIdRef.current = runId;

    logEvent({
      type: "pairings_requested",
      coffeeId: selectedCoffee.id,
      metadata: freeTextCoffee ? { freeTextCoffee, style: pairingStyle } : { style: pairingStyle },
    });
    setIsLoading(true);
    setError(null);
    setOrderMessage(null);
    setLastDurationMs(null);
    try {
      const start = performance.now();
      const contextBits = [
        pairingStyle === "contrast"
          ? "Prefer contrast pairings (brightness against richness)."
          : pairingStyle === "complement"
          ? "Prefer complementary pairings (matching sweetness/texture)."
          : "Balanced pairing between coffee and pastry.",
        freeTextCoffee.trim() ? `User described coffee as: ${freeTextCoffee.trim()}` : "",
      ]
        .filter(Boolean)
        .join(" ");
      const results = await getPairings(selectedCoffee, activeMenu, contextBits || undefined);
      const end = performance.now();

      if (requestIdRef.current !== runId) return;

      setLastDurationMs(Math.round(end - start));
      setLastUpdatedAt(new Date().toLocaleTimeString());
      setPairings(results);
      setPairingSnapshot({
        coffee: `${selectedCoffee.name} (${selectedCoffee.tastingNotes.join(", ")})`,
        pairing: results.map((item) => ({
          pastry: item.pastry.name,
          reason: item.reason,
        })),
      });
    } catch {
      if (requestIdRef.current !== runId) return;
      setError("We hit a snag contacting the pairing AI. Showing backup suggestions.");
    } finally {
      if (requestIdRef.current === runId) {
        setIsLoading(false);
      }
    }
  };

  const handleAddToCart = (pastryId: string) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.pastryId === pastryId);
      if (existing) {
        return prev.map((item) =>
          item.pastryId === pastryId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { pastryId, quantity: 1 }];
    });
  };

  const handleQuantityChange = (pastryId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => ({
          ...item,
          quantity: item.pastryId === pastryId ? Math.max(0, item.quantity + delta) : item.quantity,
        }))
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveFromCart = (pastryId: string) => {
    setCart((prev) => prev.filter((item) => item.pastryId !== pastryId));
  };

  const handleResetCart = () => setCart([]);

  const handleCheckout = () => {
    if (!selectedCoffee || cart.length === 0) return;
    const pastryIds = cart.map((item) => item.pastryId);
    logEvent({ type: "checkout", coffeeId: selectedCoffee.id, pastryIds });
    const summary = cart
      .map((item) => {
        const pastry = pastryList.find((p) => p.id === item.pastryId);
        return pastry ? `${item.quantity} x ${pastry.name}` : null;
      })
      .filter(Boolean)
      .join(", ");
    setOrderMessage(`Order confirmed for ${shopName}. Items: ${summary}. Total ${formatTotal(cartTotal)}.`);
    setCart([]);
  };

  const handleAddPastry = () => {
    const priceNum = parseFloat(newPastry.price);
    if (!newPastry.name || Number.isNaN(priceNum)) return;
    const id = newPastry.name.toLowerCase().replace(/\s+/g, "-");
    const updated = {
      id,
      name: newPastry.name,
      origin: newPastry.origin || "House",
      price: priceNum,
      currency: "EUR" as const,
      notableDescription: newPastry.notableDescription || "Freshly added pastry.",
      tastingNotes: newPastry.category ? [newPastry.category] : ["house special"],
      image: "/images/pastry-placeholder.jpg",
    };
    setPastryList((prev) => [...prev, updated]);
    setAvailability((prev) => ({ ...prev, [id]: true }));
    setNewPastry({ name: "", origin: "", price: "", notableDescription: "", category: "" });
  };

  const selectedPastryDetails = (pastryId: string) => pastryList.find((p) => p.id === pastryId);

  const handleDownloadAnalytics = () => {
    const blob = new Blob([JSON.stringify(analyticsEvents, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "analytics-events.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const toggleAvailability = (id: string) => {
    setAvailability((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className={styles.page}>
      <div className={styles.ambient}>
        <span className={`${styles.glow} ${styles.glowOne}`} />
        <span className={`${styles.glow} ${styles.glowTwo}`} />
        <span className={`${styles.glow} ${styles.glowThree}`} />
      </div>

      <section className={styles.card}>
        <div className={styles.topRow}>
          <div className={styles.badges}>
            <span className={styles.pill}>Live demo</span>
            <span className={styles.pillSoft}>Input to output ready</span>
          </div>
          <div className={styles.shopBadge}>
            {shopLogo ? (
              <img src={shopLogo} alt={`${shopName} logo`} className={styles.shopLogo} />
            ) : (
              <span className={styles.shopInitials}>{getInitials(shopName || "SS")}</span>
            )}
            <span className={styles.status}>{shopName}</span>
          </div>
        </div>

        <div className={styles.headline}>
          <p className={styles.eyebrow}>Pairings UI - AI assisted</p>
          <h1 className={styles.title}>Coffee to pastry pairing playground</h1>
          <p className={styles.lead}>
            Select a coffee and we will suggest two to three pastries from the {shopName} menu with clear reasoning.
          </p>
          <p className={styles.note}>Tightened demo flow: input, pairing logic, cart, checkout.</p>
        </div>

        <div className={styles.flow}>
          {flowSteps.map((step) => (
            <div key={step.label} className={`${styles.flowStep} ${step.done ? styles.flowStepDone : ""}`}>
              <span className={styles.flowDot} aria-hidden />
              <div>
                <p className={styles.flowLabel}>{step.label}</p>
                <p className={styles.flowValue}>{step.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.howItWorks}>
          <span>1) Capture coffee notes (dropdown or free text/QR)</span>
          <span>2) AI suggests 2-3 pastries with per-item reasoning</span>
          <span>3) Add to cart and run a clear checkout flow</span>
        </div>

        {selectedCoffee && (
          <div className={styles.infoPanel}>
            <div className={styles.infoColumn}>
              <p className={styles.infoLabel}>Origin</p>
              <p className={styles.infoValue}>{selectedCoffee.origin}</p>
            </div>
            <div className={styles.infoColumn}>
              <p className={styles.infoLabel}>Process</p>
              <p className={styles.infoValue}>{selectedCoffee.process ?? "N/A"}</p>
            </div>
            <div className={styles.infoColumn}>
              <p className={styles.infoLabel}>Variety</p>
              <p className={styles.infoValue}>{selectedCoffee.variety ?? "N/A"}</p>
            </div>
            <div className={styles.infoColumn}>
              <p className={styles.infoLabel}>Tasting notes</p>
              <div className={styles.tags}>
                {selectedCoffee.tastingNotes.map((note) => (
                  <span key={note} className={styles.tag}>
                    {note}
                  </span>
                ))}
              </div>
            </div>
            {selectedCoffee.style && (
              <div className={styles.infoColumn}>
                <p className={styles.infoLabel}>Style</p>
                <p className={styles.infoValue}>{selectedCoffee.style}</p>
              </div>
            )}
            <div className={styles.infoColumnFull}>
              <p className={styles.infoLabel}>Taste profile</p>
              <p className={styles.infoValue}>
                {pairingStyle === "contrast"
                  ? "We will lean into contrasts: brighter pastries to lift richer notes, or richer pastries to cushion acidity."
                  : pairingStyle === "complement"
                  ? "We will mirror key notes by matching sweetness, spice, or texture for a seamless pairing."
                  : "We will balance sweetness, spice, and body for a harmonious match."}
              </p>
            </div>
          </div>
        )}

        <div className={styles.controls}>
          <div className={styles.field}>
            <label htmlFor="coffee" className={styles.label}>
              Coffee
            </label>
            <div className={styles.customSelect} ref={dropdownRef}>
              <button
                type="button"
                className={`${styles.selectTrigger} ${isDropdownOpen ? styles.selectOpen : ""}`}
                onClick={() => setIsDropdownOpen((open) => !open)}
                aria-haspopup="listbox"
                aria-expanded={isDropdownOpen}
                aria-controls="coffee-options"
              >
                <div className={styles.triggerContent}>
                  <p className={styles.triggerTitle}>{selectedCoffee?.name}</p>
                  <p className={styles.triggerSubtitle}>{selectedCoffee?.tastingNotes.join(" | ")}</p>
                </div>
                <span className={styles.chevron} />
              </button>
              {isDropdownOpen && (
                <div
                  id="coffee-options"
                  role="listbox"
                  className={styles.options}
                  aria-activedescendant={selectedCoffeeId}
                >
                  {coffeeList.map((coffee) => (
                    <button
                      key={coffee.id}
                      role="option"
                      aria-selected={selectedCoffeeId === coffee.id}
                      className={`${styles.option} ${selectedCoffeeId === coffee.id ? styles.optionActive : ""}`}
                      onClick={() => {
                        setSelectedCoffeeId(coffee.id);
                        setIsDropdownOpen(false);
                        logEvent({ type: "coffee_selected", coffeeId: coffee.id });
                      }}
                    >
                      <div className={styles.optionHeader}>
                        <p className={styles.optionTitle}>{coffee.name}</p>
                        {selectedCoffeeId === coffee.id && <span className={styles.dot} />}
                      </div>
                      <p className={styles.optionNotes}>{coffee.tastingNotes.join(" | ")}</p>
                      <p className={styles.optionMeta}>{coffee.origin}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Pairing style</label>
            <select
              className={styles.select}
              value={pairingStyle}
              onChange={(e) => setPairingStyle(e.target.value as typeof pairingStyle)}
            >
              <option value="balanced">Balanced</option>
              <option value="contrast">Contrast</option>
              <option value="complement">Complement</option>
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="free-text" className={styles.label}>
              Free-text coffee input
            </label>
            <input
              id="free-text"
              className={styles.select}
              placeholder="e.g., fruity Ethiopian Yirgacheffe, light roast"
              value={freeTextCoffee}
              onChange={(e) => setFreeTextCoffee(e.target.value)}
              onBlur={() => {
                if (freeTextCoffee.trim()) {
                  logEvent({
                    type: "coffee_selected",
                    coffeeId: selectedCoffee?.id,
                    metadata: { freeText: freeTextCoffee },
                  });
                }
              }}
            />
          </div>

          <div className={styles.actionsRow}>
            <button
              className={styles.button}
              type="button"
              onClick={handleGetPairings}
              disabled={isLoading || !selectedCoffee}
            >
              {isLoading ? "Getting pairings..." : "Get pairings"}
            </button>
            <button
              type="button"
              className={`${styles.button} ${styles.buttonSecondary}`}
              onClick={() => {
                setSelectedCoffeeId("sweetspot-standard");
                setFreeTextCoffee("Scanned QR: Sweetspot Standard");
                logEvent({ type: "coffee_selected", coffeeId: "sweetspot-standard" });
              }}
            >
              Simulate QR scan
            </button>
          </div>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.results} aria-live="polite">
          {isLoading && (
            <div className="space-y-3">
              <p className={styles.muted}>Steaming your pairings...</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-slate-200 bg-white shadow-sm animate-pulse overflow-hidden"
                  >
                    <div className="h-16 bg-gradient-to-r from-slate-100 to-slate-200" />
                    <div className="p-4 space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <span className="h-6 w-16 rounded-full bg-slate-100" />
                        <span className="h-6 w-20 rounded-full bg-slate-100" />
                      </div>
                      <div className="h-4 w-11/12 rounded bg-slate-100" />
                      <div className="h-3 w-1/2 rounded bg-slate-100" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isLoading && pairings.length === 0 && !error && (
            <p className={styles.muted}>Select a coffee and click "Get pairings" to see recommended pastries.</p>
          )}

          {!isLoading && pairings.length > 0 && selectedCoffee && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 text-white p-5 shadow-xl border border-white/20">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em]">Selected coffee</p>
                  <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-white/20 border border-white/30">
                    {selectedCoffee.process ?? "Specialty"}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl sm:text-2xl font-black">{selectedCoffee.name}</h2>
                  <span className="px-3 py-1 rounded-full bg-white/15 text-xs font-semibold border border-white/30">
                    {selectedCoffee.origin}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white/10 text-[11px] font-semibold border border-white/20">
                    Style: {pairingStyle}
                  </span>
                  {lastDurationMs !== null && (
                    <span className="px-3 py-1 rounded-full bg-white/10 text-[11px] font-semibold border border-white/20">
                      Response: {lastDurationMs} ms
                    </span>
                  )}
                  {lastUpdatedAt && (
                    <span className="px-3 py-1 rounded-full bg-white/10 text-[11px] font-semibold border border-white/20">
                      Updated: {lastUpdatedAt}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedCoffee.tastingNotes.map((note) => (
                    <span
                      key={note}
                      className="px-3 py-1 rounded-full bg-white/15 text-xs font-semibold border border-white/20"
                    >
                      {note}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pairingsWithInsight.map(({ pastry, reason, insight }) => (
                  <article
                    key={pastry.id}
                    className="group rounded-2xl bg-white shadow-md hover:shadow-2xl border border-slate-100 overflow-hidden transition transform hover:-translate-y-1"
                    onClick={() => logEvent({ type: "pastry_clicked", coffeeId: selectedCoffee.id, pastryId: pastry.id })}
                  >
                    <div className="bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 px-4 py-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-lg font-bold text-white leading-tight">{pastry.name}</p>
                        <p className="text-sm text-white/80">{pastry.origin}</p>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-white/90 text-sky-700 text-sm font-semibold shadow-sm">
                        {pastry.price.toFixed(2)} {pastry.currency}
                      </span>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                          {pastry.image ? (
                            <img src={pastry.image} alt={pastry.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-[15px] leading-6 text-slate-800">{reason}</p>
                        </div>
                      </div>
                      <div className={styles.pairingInsights}>
                        <div>
                          <p className={styles.infoLabel}>Matches</p>
                          <div className="flex flex-wrap gap-2">
                            {insight.matches.length === 0 ? (
                              <span className={styles.subtlePill}>Texture/body focus</span>
                            ) : (
                              insight.matches.map((note) => (
                                <span key={note} className={styles.subtlePill}>
                                  {note}
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                        <div>
                          <p className={styles.infoLabel}>Complements</p>
                          <div className="flex flex-wrap gap-2">
                            {insight.complements.map((note) => (
                              <span key={note} className={`${styles.subtlePill} ${styles.subtlePillAlt}`}>
                                {note}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-xs text-slate-500 space-y-1">
                          <p>Notes: {pastry.notableDescription}</p>
                          <p className="text-[11px]">Tasting: {pastry.tastingNotes.join(", ")}</p>
                        </div>
                        <button
                          type="button"
                          className="px-3 py-1 rounded-full bg-slate-100 text-slate-900 font-semibold text-xs hover:bg-blue-50 hover:text-blue-700 transition"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(pastry.id);
                            logEvent({
                              type: "add_to_cart",
                              coffeeId: selectedCoffee.id,
                              pastryId: pastry.id,
                            });
                          }}
                        >
                          Pair
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {pairingSnapshot && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-sm text-slate-800 overflow-auto">
                  <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-[0.14em]">
                    Developer view (JSON)
                  </p>
                  <pre className="whitespace-pre-wrap break-words text-xs bg-white rounded-lg border border-slate-200 p-3 shadow-inner">
                    {JSON.stringify(pairingSnapshot, null, 2)}
                  </pre>
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={handleDownloadAnalytics}
                      className="px-3 py-1 rounded-full bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700 transition"
                    >
                      Download analytics JSON
                    </button>
                  </div>
                </div>
              )}
              <div className="rounded-xl border border-slate-200 bg-white/80 p-3 text-xs text-slate-800">
                <p className="font-semibold text-slate-700 mb-2">Insights (live)</p>
                <div className="flex flex-wrap gap-3 text-[11px]">
                  <span className="px-2 py-1 rounded-full bg-slate-100 font-semibold">
                    Events: {analyticsEvents.length}
                  </span>
                  <span className="px-2 py-1 rounded-full bg-slate-100 font-semibold">
                    Pairings requested: {analyticsEvents.filter((e) => e.type === "pairings_requested").length}
                  </span>
                  <span className="px-2 py-1 rounded-full bg-slate-100 font-semibold">
                    Pastry clicks: {analyticsEvents.filter((e) => e.type === "pastry_clicked").length}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-800">Cart and checkout</h3>
              <span className="text-xs text-slate-500">Pilot demo</span>
            </div>
            {cart.length === 0 ? (
              <p className="text-sm text-slate-500">No items yet. Add a pastry to the cart.</p>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => {
                  const pastry = selectedPastryDetails(item.pastryId);
                  if (!pastry) return null;
                  return (
                    <div
                      key={item.pastryId}
                      className="flex items-center justify-between border border-slate-100 rounded-xl p-3 bg-slate-50"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800">{pastry.name}</p>
                        <p className="text-xs text-slate-500">{pastry.origin}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="px-2 py-1 rounded bg-white border text-xs"
                          onClick={() => handleQuantityChange(item.pastryId, -1)}
                        >
                          -
                        </button>
                        <span className="text-sm font-semibold">{item.quantity}</span>
                        <button
                          type="button"
                          className="px-2 py-1 rounded bg-white border text-xs"
                          onClick={() => handleQuantityChange(item.pastryId, 1)}
                        >
                          +
                        </button>
                        <span className="text-sm font-semibold">
                          {(pastry.price * item.quantity).toFixed(2)} {pastry.currency}
                        </span>
                        <button
                          type="button"
                          className="text-xs text-red-600 underline"
                          onClick={() => handleRemoveFromCart(item.pastryId)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-800">Total</p>
                    <p className="text-xs text-slate-500">Checkout is a mock for demo clarity.</p>
                  </div>
                  <p className="font-bold text-slate-900">{formatTotal(cartTotal)}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="flex-1 py-2 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-semibold"
                    onClick={handleCheckout}
                  >
                    Checkout (mock)
                  </button>
                  <button
                    type="button"
                    className="px-3 py-2 rounded-full border text-xs font-semibold text-slate-700"
                    onClick={handleResetCart}
                  >
                    Clear cart
                  </button>
                </div>
                {orderMessage && <p className="text-sm text-green-700">{orderMessage}</p>}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-800">Admin Panel</h3>
                <p className="text-xs text-slate-500">Toggle menu and add pastries (local demo only).</p>
              </div>
              <span className="text-xs text-slate-500">
                Active menu: {activeMenu.length}/{pastryList.length}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-600">Shop name</label>
                <input className="border rounded px-3 py-2 text-sm" value={shopName} onChange={(e) => setShopName(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-600">Logo URL</label>
                <input className="border rounded px-3 py-2 text-sm" value={shopLogo} onChange={(e) => setShopLogo(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-600">Pastry name</label>
                <input
                  className="border rounded px-3 py-2 text-sm"
                  value={newPastry.name}
                  onChange={(e) => setNewPastry((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-600">Vendor</label>
                <input
                  className="border rounded px-3 py-2 text-sm"
                  value={newPastry.origin}
                  onChange={(e) => setNewPastry((p) => ({ ...p, origin: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-600">Price (EUR)</label>
                <input
                  className="border rounded px-3 py-2 text-sm"
                  value={newPastry.price}
                  onChange={(e) => setNewPastry((p) => ({ ...p, price: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-600">Category / tag</label>
                <input
                  className="border rounded px-3 py-2 text-sm"
                  value={newPastry.category}
                  onChange={(e) => setNewPastry((p) => ({ ...p, category: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600">Short description</label>
              <textarea
                className="border rounded px-3 py-2 text-sm"
                value={newPastry.notableDescription}
                onChange={(e) => setNewPastry((p) => ({ ...p, notableDescription: e.target.value }))}
              />
            </div>
            <button
              type="button"
              className="w-full py-2 rounded-full bg-slate-900 text-white font-semibold hover:bg-slate-800"
              onClick={handleAddPastry}
            >
              Add pastry (demo sync)
            </button>

            <div className={styles.adminList}>
              {pastryList.map((pastry) => (
                <div key={pastry.id} className={styles.adminItem}>
                  <div>
                    <p className="font-semibold text-slate-800">{pastry.name}</p>
                    <p className="text-xs text-slate-500">{pastry.origin}</p>
                  </div>
                  <div className={styles.adminActions}>
                    <span
                      className={`${styles.statusPill} ${
                        availability[pastry.id] !== false ? styles.statusOn : styles.statusOff
                      }`}
                    >
                      {availability[pastry.id] !== false ? "On menu" : "Hidden"}
                    </span>
                    <button
                      type="button"
                      className={styles.availabilityButton}
                      onClick={() => toggleAvailability(pastry.id)}
                    >
                      {availability[pastry.id] !== false ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              Demo-only admin writes to local state to simulate instant sync. Hook to Supabase/Firebase later.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
