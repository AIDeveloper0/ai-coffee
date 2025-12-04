"use client";

import CoffeePairingPage from "./CoffeePairingPage";
import AnalyticsDebugPanel from "@/components/AnalyticsDebugPanel";

export default function Home() {
  return (
    <>
      <CoffeePairingPage />
      {process.env.NODE_ENV === "development" && <AnalyticsDebugPanel />}
    </>
  );
}
