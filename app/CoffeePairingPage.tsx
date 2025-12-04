"use client";

import { useMemo, useState } from "react";
import { coffees, pastries } from "@/data";
import type { Coffee } from "@/data";
import { getPairings, type PairingResult } from "@/pairingService";
import styles from "./page.module.css";

export default function CoffeePairingPage() {
  const [selectedCoffeeId, setSelectedCoffeeId] = useState<string>(coffees[0]?.id ?? "");
  const [pairings, setPairings] = useState<PairingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCoffee: Coffee | undefined = useMemo(
    () => coffees.find((c) => c.id === selectedCoffeeId),
    [selectedCoffeeId]
  );

  const handleGetPairings = async () => {
    if (!selectedCoffee) return;
    setIsLoading(true);
    setError(null);
    try {
      const results = await getPairings(selectedCoffee, pastries);
      setPairings(results);
    } catch {
      setError("Unable to fetch pairings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <section className={styles.card}>
        <p className={styles.eyebrow}>Phase 4 · Pairings UI</p>
        <h1 className={styles.title}>Coffee × pastry pairing playground</h1>
        <p className={styles.lead}>
          Select a coffee and fetch AI-backed pastry pairings with pricing and reasoning.
        </p>
        <p className={styles.note}>Prototype using Sweet Spot Coffee Roasters data.</p>

        {selectedCoffee && (
          <div className={styles.infoPanel}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Origin</span>
              <span className={styles.infoValue}>{selectedCoffee.origin}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Tasting notes</span>
              <span className={styles.infoValue}>
                {selectedCoffee.tastingNotes.join(", ")}
              </span>
            </div>
          </div>
        )}

        <div className={styles.controls}>
          <div className={styles.field}>
            <label htmlFor="coffee" className={styles.label}>
              Coffee
            </label>
            <select
              id="coffee"
              className={styles.select}
              value={selectedCoffeeId}
              onChange={(e) => setSelectedCoffeeId(e.target.value)}
            >
              {coffees.map((coffee) => (
                <option key={coffee.id} value={coffee.id}>
                  {coffee.name} — {coffee.tastingNotes.join(", ")}
                </option>
              ))}
            </select>
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
          {isLoading && <p className={styles.muted}>Loading pairings…</p>}

          {!isLoading && pairings.length === 0 && !error && (
            <p className={styles.muted}>No pairings yet. Choose a coffee to get started.</p>
          )}

          <div className={styles.grid}>
            {pairings.map(({ pastry, reason }) => (
              <article key={pastry.id} className={styles.cardItem}>
                <div className={styles.imagePlaceholder}>Image coming soon</div>
                <div className={styles.cardBody}>
                  <div className={styles.cardHeader}>
                    <div>
                      <h3 className={styles.pastryName}>{pastry.name}</h3>
                      <p className={styles.pastryVendor}>{pastry.origin}</p>
                    </div>
                    <span className={styles.price}>
                      {pastry.price.toFixed(2)} {pastry.currency}
                    </span>
                  </div>
                  <p className={styles.reason}>{reason}</p>
                  <p className={styles.notes}>Notes: {pastry.tastingNotes.join(", ")}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
