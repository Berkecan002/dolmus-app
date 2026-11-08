import React from 'react';
import { RotateCcw } from 'lucide-react';
import { QUICK_FILTERS } from '../../data/mockRoutes';
import { useTransportStore } from '../../store/useTransportStore';

export const QuickFilters: React.FC = React.memo(() => {
  const activeQuickFilterId = useTransportStore(
    (state) => state.activeQuickFilterId
  );
  const applyQuickFilter = useTransportStore((state) => state.applyQuickFilter);

  const handleSelectFilter = (filterId: string): void => {
    if (activeQuickFilterId === filterId) {
      applyQuickFilter(null);
    } else {
      applyQuickFilter(filterId);
    }
  };

  return (
    <nav
      aria-label="Kırıkkale Bölge ve Kampüs Hızlı Erişim Filtreleri"
      className="pointer-events-auto flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 px-0.5"
    >
      {QUICK_FILTERS.map((filter) => {
        const isActive = activeQuickFilterId === filter.id;
        return (
          <button
            key={filter.id}
            type="button"
            onClick={() => handleSelectFilter(filter.id)}
            aria-pressed={isActive}
            className={`min-h-[44px] px-3.5 py-2 rounded-2xl text-xs font-bold shrink-0 transition-all duration-300 ease-out shadow-md border backdrop-blur-md flex items-center gap-1.5 ${
              isActive
                ? 'bg-blue-600 text-white border-blue-500 scale-[1.02]'
                : 'bg-white/85 dark:bg-slate-900/85 text-slate-800 dark:text-slate-100 border-slate-200/80 dark:border-slate-700/80 hover:bg-white dark:hover:bg-slate-800'
            }`}
          >
            <span>{filter.label}</span>
          </button>
        );
      })}

      {activeQuickFilterId !== null && (
        <button
          type="button"
          onClick={() => applyQuickFilter(null)}
          aria-label="Hızlı filtreyi sıfırla"
          className="min-h-[44px] min-w-[44px] px-3 py-2 rounded-2xl text-xs font-bold shrink-0 backdrop-blur-md bg-slate-900/85 dark:bg-slate-800/85 text-white border border-slate-700 shadow-md flex items-center gap-1 transition-all duration-300 ease-out"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Sıfırla</span>
        </button>
      )}
    </nav>
  );
});

QuickFilters.displayName = 'QuickFilters';
