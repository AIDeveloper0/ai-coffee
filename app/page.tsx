import dynamic from "next/dynamic";
import CoffeePairingPage from "./CoffeePairingPage";

const AnalyticsDebugPanel = dynamic(() => import("@/components/AnalyticsDebugPanel"), {
  ssr: false,
});

export default function Home() {
  return (
    <>
      <CoffeePairingPage />
      {process.env.NODE_ENV === "development" && <AnalyticsDebugPanel />}
    </>
  );
}
