"use client";

import { events, exportEventsAsCsv, exportEventsAsJson } from "@/lib/analytics";
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
      <div className="flex justify-end mt-3 gap-2">
        <button
          type="button"
          onClick={handleDownload}
          className="px-3 py-1 rounded-full bg-slate-800 text-white font-semibold text-[11px] hover:bg-slate-700 transition"
        >
          Download JSON
        </button>
        <button
          type="button"
          onClick={() => {
            const data = exportEventsAsCsv();
            const blob = new Blob([data], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "analytics-events.csv";
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
          }}
          className="px-3 py-1 rounded-full bg-slate-200 text-slate-900 font-semibold text-[11px] hover:bg-slate-300 transition"
        >
          Download CSV
        </button>
      </div>
    </div>
  );
}
