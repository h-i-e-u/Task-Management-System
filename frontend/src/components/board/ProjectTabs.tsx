import { BOARD_TABS, type BoardTab } from "./types";

export default function ProjectTabs({ tab, onChange }: { tab: BoardTab; onChange: (t: BoardTab) => void }) {
  return (
    <div className="flex gap-1 border-b border-slate-200" role="tablist" aria-label="Project tabs">
      {BOARD_TABS.map((t) => {
        const active = t.id === tab;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              active
                ? "border-indigo-600 text-indigo-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
