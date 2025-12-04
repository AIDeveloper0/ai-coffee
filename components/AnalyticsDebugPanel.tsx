"use client";

import { events, exportEventsAsJson } from "@/lib/analytics";
import { useMemo } from "react";

export default function AnalyticsDebugPanel() {
  const lastThree = useMemo(() => events.slice(-3), [events.length]);

  const handleDownload = () => {
    const data = exportEventsAsJson();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "analytics-events.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-white/80 shadow-sm p-4 text-xs text-slate-800 max-h-64 overflow-auto">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-slate-700">Analytics events (debug)</h4>
        <span className="px-2 py-1 rounded-full bg-slate-100 text-[11px] font-semibold">
          {events.length} events
        </span>
      </div>
      <pre className="whitespace-pre-wrap break-words bg-slate-50 border border-slate-200 rounded-lg p-3 text-[11px] leading-5">
        {JSON.stringify(lastThree, null, 2)}
      </pre>
      <div className="flex justify-end mt-3">
        <button
          type="button"
          onClick={handleDownload}
          className="px-3 py-1 rounded-full bg-slate-800 text-white font-semibold text-[11px] hover:bg-slate-700 transition"
        >
          Download analytics JSON
        </button>
      </div>
    </div>
  );
}
