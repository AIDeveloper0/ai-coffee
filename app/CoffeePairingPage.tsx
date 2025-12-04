"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { coffees, pastries } from "@/data";
import type { Coffee } from "@/data";
import { getPairings, type PairingResult } from "@/pairingService";
import styles from "./page.module.css";

export default function CoffeePairingPage() {
  const [selectedCoffeeId, setSelectedCoffeeId] = useState<string>(coffees[0]?.id ?? "");
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
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const selectedCoffee: Coffee | undefined = useMemo(
    () => coffees.find((c) => c.id === selectedCoffeeId),
    [selectedCoffeeId]
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
    setIsLoading(true);
    setError(null);
    try {
      const results = await getPairings(selectedCoffee, pastries);
      setPairings(results);
      setPairingSnapshot({
        coffee: `${selectedCoffee.name} (${selectedCoffee.tastingNotes.join(", ")})`,
        pairing: results.map((item) => ({
          pastry: item.pastry.name,
          reason: item.reason,
        })),
      });
    } catch {
      setError("We hit a snag contacting the pairing AI. Showing backup suggestions.");
    } finally {
      setIsLoading(false);
    }
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
          </div>
          <span className={styles.status}>Sweet Spot Coffee Roasters</span>
        </div>

        <div className={styles.headline}>
          <p className={styles.eyebrow}>Pairings UI · AI assisted</p>
          <h1 className={styles.title}>Coffee × pastry pairing playground</h1>
          <p className={styles.lead}>
            Select a coffee and we&apos;ll suggest 2–3 pastries from the Sweet Spot menu that match its tasting notes.
          </p>
          <p className={styles.note}>
            Prototype for Sweet Spot Coffee Roasters, Munich — made for the AI pairing qualification test.
          </p>
        </div>

        {selectedCoffee && (
          <div className={styles.infoPanel}>
            <div className={styles.infoColumn}>
              <p className={styles.infoLabel}>Origin</p>
              <p className={styles.infoValue}>{selectedCoffee.origin}</p>
            </div>
            <div className={styles.infoColumn}>
              <p className={styles.infoLabel}>Process</p>
              <p className={styles.infoValue}>{selectedCoffee.process ?? "—"}</p>
            </div>
            <div className={styles.infoColumn}>
              <p className={styles.infoLabel}>Variety</p>
              <p className={styles.infoValue}>{selectedCoffee.variety ?? "—"}</p>
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
                  <p className={styles.triggerSubtitle}>
                    {selectedCoffee?.tastingNotes.join(" · ")}
                  </p>
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
                  {coffees.map((coffee) => (
                    <button
                      key={coffee.id}
                      role="option"
                      aria-selected={selectedCoffeeId === coffee.id}
                      className={`${styles.option} ${
                        selectedCoffeeId === coffee.id ? styles.optionActive : ""
                      }`}
                      onClick={() => {
                        setSelectedCoffeeId(coffee.id);
                        setIsDropdownOpen(false);
                      }}
                    >
                      <div className={styles.optionHeader}>
                        <p className={styles.optionTitle}>{coffee.name}</p>
                        {selectedCoffeeId === coffee.id && <span className={styles.dot} />}
                      </div>
                      <p className={styles.optionNotes}>{coffee.tastingNotes.join(" · ")}</p>
                      <p className={styles.optionMeta}>{coffee.origin}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            className={styles.button}
            type="button"
            onClick={handleGetPairings}
            disabled={isLoading || !selectedCoffee}
          >
            {isLoading ? "Getting pairings..." : "Get pairings"}
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.results}>
          {isLoading && (
            <div className="space-y-3">
              <p className={styles.muted}>Steaming your pairings…</p>
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
            <p className={styles.muted}>
              Select a coffee and click “Get pairings” to see recommended pastries.
            </p>
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
                {pairings.map(({ pastry, reason }) => (
                  <article
                    key={pastry.id}
                    className="group rounded-2xl bg-white shadow-md hover:shadow-2xl border border-slate-100 overflow-hidden transition transform hover:-translate-y-1"
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
                      <div className="flex flex-wrap gap-2">
                        {pastry.tastingNotes.map((note) => (
                          <span
                            key={note}
                            className="px-3 py-1 rounded-full bg-sky-50 text-sky-700 text-xs font-semibold border border-sky-100"
                          >
                            {note}
                          </span>
                        ))}
                      </div>
                      <p className="text-[15px] leading-6 text-slate-800">{reason}</p>
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-xs text-slate-500 space-y-1">
                          <p>Notes: {pastry.notableDescription}</p>
                          <p className="text-[11px]">Tasting: {pastry.tastingNotes.join(", ")}</p>
                        </div>
                        <button
                          type="button"
                          className="px-3 py-1 rounded-full bg-slate-100 text-slate-900 font-semibold text-xs hover:bg-blue-50 hover:text-blue-700 transition"
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
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
