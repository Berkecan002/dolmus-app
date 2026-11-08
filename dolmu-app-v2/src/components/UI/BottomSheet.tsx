import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRightLeft,
  Bus,
  Calculator,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  MapPin,
  Navigation2,
  Repeat,
  RotateCcw,
  Search,
  SearchX,
  Star,
  Wallet,
  X,
} from 'lucide-react';
import { QUICK_FILTERS } from '../../data/mockRoutes';
import { useFavoritesStore } from '../../store/useFavoritesStore';
import { useTransportStore } from '../../store/useTransportStore';
import type { RouteLine, ScheduleDayType, Stop } from '../../types/transport';
import { findBestRoute, getUniqueStops } from '../../utils/routeFinder';
import { FareCalculator } from './FareCalculator';
import { LastBusCountdown } from './LastBusCountdown';
import { StopLiveStatus } from './StopLiveStatus';

type SheetTab = 'routes' | 'routeFinder' | 'fareCalculator';

export const BottomSheet: React.FC = () => {
  const routes = useTransportStore((state) => state.routes);
  const selectedRouteId = useTransportStore((state) => state.selectedRouteId);
  const selectedStop = useTransportStore((state) => state.selectedStop);
  const activeQuickFilterId = useTransportStore(
    (state) => state.activeQuickFilterId
  );
  const searchQuery = useTransportStore((state) => state.searchQuery);
  const scheduleDayType = useTransportStore((state) => state.scheduleDayType);
  const isBottomSheetOpen = useTransportStore((state) => state.isBottomSheetOpen);

  const selectRoute = useTransportStore((state) => state.selectRoute);
  const selectStop = useTransportStore((state) => state.selectStop);
  const applyQuickFilter = useTransportStore((state) => state.applyQuickFilter);
  const setSearchQuery = useTransportStore((state) => state.setSearchQuery);
  const setScheduleDayType = useTransportStore((state) => state.setScheduleDayType);
  const setBottomSheetOpen = useTransportStore((state) => state.setBottomSheetOpen);

  const favoriteRouteIds = useFavoritesStore((state) => state.favoriteRouteIds);
  const favoriteStopIds = useFavoritesStore((state) => state.favoriteStopIds);
  const toggleFavoriteRoute = useFavoritesStore(
    (state) => state.toggleFavoriteRoute
  );
  const toggleFavoriteStop = useFavoritesStore((state) => state.toggleFavoriteStop);

  const [activeTab, setActiveTab] = useState<SheetTab>('routes');
  const [showInlineCalculator, setShowInlineCalculator] = useState<boolean>(false);

  const uniqueStops = useMemo(() => getUniqueStops(routes), [routes]);
  const [fromStopId, setFromStopId] = useState<string>(
    () => uniqueStops[2]?.id ?? uniqueStops[0]?.id ?? ''
  );
  const [toStopId, setToStopId] = useState<string>(
    () => uniqueStops[9]?.id ?? uniqueStops[uniqueStops.length - 1]?.id ?? ''
  );

  const selectedRoute = useMemo(
    () => routes.find((route) => route.id === selectedRouteId) ?? null,
    [routes, selectedRouteId]
  );

  // Favori hatları listenin en üstüne sabitle (pinned), hızlı filtre ve arama sorgusuna göre süz
  const sortedAndFilteredRoutes = useMemo((): RouteLine[] => {
    let baseList = routes;

    if (activeQuickFilterId !== null) {
      const quickFilter = QUICK_FILTERS.find((f) => f.id === activeQuickFilterId);
      if (quickFilter !== undefined) {
        if (quickFilter.onlyFavorites === true) {
          baseList = routes.filter((r) => favoriteRouteIds.includes(r.id));
        } else if (quickFilter.routeCodes !== undefined) {
          baseList = routes.filter((r) =>
            quickFilter.routeCodes?.includes(r.code)
          );
        }
      }
    }

    const normalized = searchQuery.trim().toLocaleLowerCase('tr-TR');

    const matching =
      normalized.length === 0
        ? baseList
        : baseList.filter((route) => {
            const codeMatch = route.code
              .toLocaleLowerCase('tr-TR')
              .includes(normalized);
            const nameMatch = route.name
              .toLocaleLowerCase('tr-TR')
              .includes(normalized);
            const stopMatch = route.stops.some((stop) =>
              stop.name.toLocaleLowerCase('tr-TR').includes(normalized)
            );
            return codeMatch || nameMatch || stopMatch;
          });

    return [...matching].sort((a, b) => {
      const aFav = favoriteRouteIds.includes(a.id) ? 1 : 0;
      const bFav = favoriteRouteIds.includes(b.id) ? 1 : 0;
      return bFav - aFav;
    });
  }, [activeQuickFilterId, favoriteRouteIds, routes, searchQuery]);

  // "Nasıl Giderim?" Aktarma & Rota Hesaplaması
  const routePlanResult = useMemo(() => {
    const fromStop = uniqueStops.find((s) => s.id === fromStopId);
    const toStop = uniqueStops.find((s) => s.id === toStopId);
    if (fromStop === undefined || toStop === undefined) {
      return null;
    }
    return findBestRoute(fromStop, toStop, routes);
  }, [fromStopId, routes, toStopId, uniqueStops]);

  const handleToggleSheet = (): void => {
    setBottomSheetOpen(!isBottomSheetOpen);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchQuery(event.target.value);
    setActiveTab('routes');
    if (!isBottomSheetOpen) {
      setBottomSheetOpen(true);
    }
  };

  const handleClearSearchAndFilters = (): void => {
    setSearchQuery('');
    applyQuickFilter(null);
  };

  const handleStopClick = (stop: Stop, routeId: string): void => {
    selectStop(stop, routeId);
  };

  const handleSwapStops = (): void => {
    setFromStopId(toStopId);
    setToStopId(fromStopId);
  };

  const handleScheduleTypeChange = (type: ScheduleDayType): void => {
    setScheduleDayType(type);
  };

  const activeDailySchedule =
    selectedRoute?.schedule[scheduleDayType] ?? selectedRoute?.schedule ?? null;

  const activeStopForLiveStatus =
    selectedStop ?? selectedRoute?.stops[0] ?? null;

  return (
    <section
      aria-label="Kırıkkale Dolmuş Hatları, Aktarma Bulucu ve Ücret Hesaplayıcı Paneli"
      className={`fixed inset-x-0 bottom-0 z-20 mx-auto max-w-xl backdrop-blur-md bg-white/85 dark:bg-slate-900/85 rounded-t-3xl shadow-sheet dark:shadow-sheet-dark border-t border-slate-200/80 dark:border-slate-800/80 transition-all duration-300 ease-out flex flex-col ${
        isBottomSheetOpen ? 'h-[63vh] sm:h-[59vh]' : 'h-[92px]'
      }`}
    >
      {/* Mobil Tutma Çizgisi (Drag Handle) */}
      <div
        onClick={handleToggleSheet}
        role="presentation"
        className="w-full pt-2.5 pb-1 flex justify-center cursor-pointer shrink-0"
      >
        <span className="w-12 h-1.5 rounded-full bg-slate-300/90 dark:bg-slate-600/90 transition-colors" />
      </div>

      {/* Üst Başlık ve Kontroller */}
      <div className="px-4 pb-2.5 border-b border-slate-200/70 dark:border-slate-800/80 flex items-center justify-between shrink-0">
        <button
          type="button"
          onClick={handleToggleSheet}
          aria-expanded={isBottomSheetOpen}
          aria-label={isBottomSheetOpen ? 'Paneli küçült' : 'Paneli genişlet'}
          className="flex-1 flex items-center gap-3 text-left min-h-[44px] py-0.5 focus:outline-none"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-blue-500/15 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 shrink-0">
            <Bus className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {activeTab === 'routeFinder'
                ? 'Nasıl Giderim? • Aktarma & Rota Bulucu'
                : activeTab === 'fareCalculator'
                  ? 'Dolmuş Ücret & Bakiye Hesaplayıcı'
                  : selectedRoute !== null
                    ? `${selectedRoute.code} • ${selectedRoute.name}`
                    : 'Kırıkkale Şehir İçi Dolmuş Hatları'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {activeTab === 'routeFinder'
                ? 'Doğrudan veya Cumhuriyet Meydanı aktarmalı rota'
                : activeTab === 'fareCalculator'
                  ? 'Günlük, haftalık (5 gün) ve aylık (20 gün) yol masrafı'
                  : selectedRoute !== null && activeDailySchedule !== null
                    ? `${selectedRoute.stops.length} durak • Her ${activeDailySchedule.frequencyMinutes} dk`
                    : `Aktif ${sortedAndFilteredRoutes.length} hat • ${favoriteRouteIds.length} favori`}
            </p>
          </div>
        </button>

        <div className="flex items-center gap-1.5">
          {activeTab === 'routes' && selectedRoute !== null && (
            <button
              type="button"
              onClick={() => selectRoute(null)}
              aria-label="Tüm hatlar listesine dön"
              className="min-h-[44px] px-3 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100/90 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all duration-300 ease-out"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Tüm Hatlar</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleToggleSheet}
            aria-label={isBottomSheetOpen ? 'Alt paneli kapat' : 'Alt paneli aç'}
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300 ease-out"
          >
            {isBottomSheetOpen ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronUp className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* İçerik Alanı */}
      {isBottomSheetOpen && (
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pt-3 pb-6 space-y-4">
          {/* Ana Mod Sekmeleri: Hatlar | Nasıl Giderim? | Ücret Hesapla */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100/90 dark:bg-slate-800/90 rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveTab('routes')}
              className={`min-h-[44px] px-2.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-300 ease-out ${
                activeTab === 'routes'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Bus className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Hatlar ({routes.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('routeFinder')}
              className={`min-h-[44px] px-2.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-300 ease-out ${
                activeTab === 'routeFinder'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Navigation2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Nasıl Giderim?</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('fareCalculator')}
              className={`min-h-[44px] px-2.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-300 ease-out ${
                activeTab === 'fareCalculator'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calculator className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Ücret Hesapla</span>
            </button>
          </div>

          {activeTab === 'fareCalculator' ? (
            <FareCalculator routes={routes} selectedRoute={selectedRoute} />
          ) : activeTab === 'routeFinder' ? (
            /* "NASIL GİDERİM?" AKTARMA VE ROTA BULUCU GÖRÜNÜMÜ */
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl backdrop-blur-md bg-white/85 dark:bg-slate-800/85 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-2 items-center">
                  <div>
                    <label
                      htmlFor="from-stop-select"
                      className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1"
                    >
                      Nereden (Başlangıç Durağı)
                    </label>
                    <select
                      id="from-stop-select"
                      value={fromStopId}
                      onChange={(e) => setFromStopId(e.target.value)}
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {uniqueStops.map((stop) => (
                        <option key={`from-${stop.id}`} value={stop.id}>
                          {stop.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleSwapStops}
                    aria-label="Başlangıç ve varış duraklarını değiştir"
                    className="min-h-[44px] min-w-[44px] mt-2 sm:mt-5 mx-auto rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                  </button>

                  <div>
                    <label
                      htmlFor="to-stop-select"
                      className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1"
                    >
                      Nereye (Varış Durağı)
                    </label>
                    <select
                      id="to-stop-select"
                      value={toStopId}
                      onChange={(e) => setToStopId(e.target.value)}
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {uniqueStops.map((stop) => (
                        <option key={`to-${stop.id}`} value={stop.id}>
                          {stop.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {routePlanResult === null ? (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400">
                  Lütfen birbirinden farklı bir başlangıç ve varış durağı seçin.
                </div>
              ) : (
                <div className="rounded-2xl p-4 backdrop-blur-md bg-white/85 dark:bg-slate-800/85 border border-slate-200/80 dark:border-slate-700/80 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                        routePlanResult.type === 'direct'
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                          : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                      }`}
                    >
                      {routePlanResult.type === 'direct'
                        ? '✓ Doğrudan Tek Dolmuşla Ulaşım'
                        : '⇄ 1 Aktarmalı Ulaşım (Aktarma Merkezi)'}
                    </span>

                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Yaklaşık <strong>{routePlanResult.totalEstimatedMinutes} dk</strong> •{' '}
                      Öğrenci: <strong>{routePlanResult.totalStudentPrice} ₺</strong> / Tam:{' '}
                      <strong>{routePlanResult.totalFullPrice} ₺</strong>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {routePlanResult.legs.map((leg, legIndex) => (
                      <div
                        key={`${leg.route.id}-${legIndex}`}
                        className="p-3 rounded-xl bg-slate-50/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-700"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className="px-2 py-0.5 rounded-md text-xs font-extrabold text-white"
                              style={{ backgroundColor: leg.route.color }}
                            >
                              {leg.route.code}
                            </span>
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {leg.route.name}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              selectRoute(leg.route.id);
                              setActiveTab('routes');
                            }}
                            className="min-h-[44px] px-2.5 py-1 rounded-lg text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800"
                          >
                            Hattı İncele
                          </button>
                        </div>

                        <p className="text-xs text-slate-700 dark:text-slate-300 mt-1.5">
                          <strong>{leg.fromStop.name}</strong> durağından binin →{' '}
                          <strong>{leg.toStop.name}</strong> durağında inin (
                          {leg.intermediateStops.length + 1} durak, ~{leg.estimatedMinutes} dk).
                        </p>
                      </div>
                    ))}

                    {routePlanResult.type === 'transfer' &&
                      routePlanResult.transferStop !== undefined && (
                        <div className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-2">
                          <span>
                            🔄 Aktarma Noktası:{' '}
                            <strong>{routePlanResult.transferStop.name}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (routePlanResult.transferStop !== undefined) {
                                selectStop(routePlanResult.transferStop);
                              }
                            }}
                            className="min-h-[44px] px-2.5 py-1 rounded-lg font-bold underline"
                          >
                            Haritada Göster
                          </button>
                        </div>
                      )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* HATLAR, ARAMA VE SEÇİLİ HAT DETAY GÖRÜNÜMÜ */
            <>
              {/* Cam Efektli Arama ve Hızlı Hat Seçim Çubuğu */}
              <div className="space-y-2.5">
                <div className="relative flex items-center">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Hat kodu, güzergah veya durak ara (Örn: Kampüs, Kaletepe)..."
                    aria-label="Hat veya durak ara"
                    className="w-full min-h-[44px] pl-10 pr-11 py-2 text-sm backdrop-blur-md bg-white/85 dark:bg-slate-800/85 border border-slate-200/90 dark:border-slate-700/90 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all duration-300 ease-out"
                  />
                  {searchQuery.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearSearchAndFilters}
                      aria-label="Aramayı temizle"
                      className="absolute right-1 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Hızlı Hat Sekmeleri */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                  <button
                    type="button"
                    onClick={() => selectRoute(null)}
                    className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all duration-300 ease-out ${
                      selectedRouteId === null
                        ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    Tümü ({routes.length})
                  </button>
                  {routes.map((route) => {
                    const isActive = route.id === selectedRouteId;
                    const isFav = favoriteRouteIds.includes(route.id);
                    return (
                      <button
                        key={route.id}
                        type="button"
                        onClick={() => selectRoute(route.id)}
                        className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 inline-flex items-center gap-2 transition-all duration-300 ease-out border ${
                          isActive
                            ? 'text-white shadow-sm border-transparent'
                            : 'bg-white/85 dark:bg-slate-800/85 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                        style={isActive ? { backgroundColor: route.color } : undefined}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: isActive ? '#ffffff' : route.color,
                          }}
                        />
                        <span>{route.code}</span>
                        {isFav && (
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Seçili Hat Detay Görünümü VEYA Hat Listesi */}
              {selectedRoute !== null &&
              activeDailySchedule !== null &&
              searchQuery.trim().length === 0 ? (
                <div className="space-y-4">
                  {/* Son Dolmuşa Ne Kadar Kaldı? Geri Sayım ve Uyarı Bandı */}
                  <LastBusCountdown
                    route={selectedRoute}
                    scheduleDayType={scheduleDayType}
                  />

                  {/* Hafta İçi / Hafta Sonu Sefer Saatleri Seçici & Favori Hat Butonu */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100/90 dark:bg-slate-800/90">
                      <button
                        type="button"
                        onClick={() => handleScheduleTypeChange('weekday')}
                        className={`min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all duration-300 ease-out ${
                          scheduleDayType === 'weekday'
                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>Hafta İçi</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleScheduleTypeChange('weekend')}
                        className={`min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all duration-300 ease-out ${
                          scheduleDayType === 'weekend'
                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Hafta Sonu</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setShowInlineCalculator((prev) => !prev)
                        }
                        aria-expanded={showInlineCalculator}
                        className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 transition-all duration-300 ease-out ${
                          showInlineCalculator
                            ? 'bg-blue-600 text-white border-blue-500'
                            : 'bg-white/85 dark:bg-slate-800/85 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <Calculator className="w-4 h-4 shrink-0" />
                        <span>Bakiye Hesapla</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleFavoriteRoute(selectedRoute.id)}
                        aria-label={
                          favoriteRouteIds.includes(selectedRoute.id)
                            ? 'Hattı favorilerden çıkar'
                            : 'Hattı favorilere sabitle'
                        }
                        className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 transition-all duration-300 ease-out ${
                          favoriteRouteIds.includes(selectedRoute.id)
                            ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300'
                            : 'bg-white/85 dark:bg-slate-800/85 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <Star
                          className={`w-4 h-4 ${
                            favoriteRouteIds.includes(selectedRoute.id)
                              ? 'fill-amber-400 text-amber-500'
                              : ''
                          }`}
                        />
                        <span>
                          {favoriteRouteIds.includes(selectedRoute.id)
                            ? 'Favori'
                            : 'Sabitle'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Açılır Günlük / Haftalık / Aylık Dolmuş Ücret Hesaplayıcı */}
                  {showInlineCalculator && (
                    <FareCalculator
                      routes={routes}
                      selectedRoute={selectedRoute}
                    />
                  )}

                  {/* Ücret, Sıklık ve Sefer Saatleri Bilgi Kartları */}
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="backdrop-blur-md bg-white/85 dark:bg-slate-800/85 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-3">
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] font-medium mb-1">
                        <Wallet className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>Ücret Tarifesi</span>
                      </div>
                      <div className="flex items-baseline justify-between gap-1">
                        <div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                            Öğrenci
                          </span>
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {selectedRoute.price.student} ₺
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                            Tam
                          </span>
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {selectedRoute.price.full} ₺
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="backdrop-blur-md bg-white/85 dark:bg-slate-800/85 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-3">
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] font-medium mb-1">
                        <Repeat className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Sefer Sıklığı</span>
                      </div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                        Her {activeDailySchedule.frequencyMinutes} dk
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {scheduleDayType === 'weekday' ? 'Hafta içi' : 'Hafta sonu'}
                      </p>
                    </div>

                    <div className="backdrop-blur-md bg-white/85 dark:bg-slate-800/85 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-3">
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] font-medium mb-1">
                        <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>İlk / Son Sefer</span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                        {activeDailySchedule.firstDeparture} -{' '}
                        {activeDailySchedule.lastDeparture}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {scheduleDayType === 'weekday'
                          ? 'Pzt - Cuma'
                          : 'Cumartesi - Pazar'}
                      </p>
                    </div>
                  </div>

                  {/* Seçili Durak Öğrenci Topluluk Bildirimleri & Paylaşım Paneli */}
                  {activeStopForLiveStatus !== null && (
                    <StopLiveStatus
                      stop={activeStopForLiveStatus}
                      route={selectedRoute}
                    />
                  )}

                  {/* Durak Dizilimi (Timeline Görünümü) */}
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Durak Dizilimi ({selectedRoute.stops.length} Durak)
                      </h3>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">
                        Canlı bildirim &amp; konum için durağa dokunun
                      </span>
                    </div>

                    <ol className="relative space-y-1">
                      {selectedRoute.stops.map((stop, index) => {
                        const isFirst = index === 0;
                        const isLast = index === selectedRoute.stops.length - 1;
                        const isStopSelected = selectedStop?.id === stop.id;
                        const isStopFav = favoriteStopIds.includes(stop.id);

                        return (
                          <li key={stop.id} className="relative flex items-center gap-1">
                            {/* Dikey Timeline Çizgisi */}
                            {!isLast && (
                              <span
                                aria-hidden="true"
                                className="absolute left-[19px] top-8 bottom-[-8px] w-0.5"
                                style={{ backgroundColor: `${selectedRoute.color}55` }}
                              />
                            )}

                            <button
                              type="button"
                              onClick={() => handleStopClick(stop, selectedRoute.id)}
                              className={`flex-1 min-h-[48px] text-left flex items-start gap-3 p-2.5 rounded-2xl transition-all duration-300 ease-out border ${
                                isStopSelected
                                  ? 'bg-blue-50/90 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 shadow-sm'
                                  : 'bg-white/75 dark:bg-slate-900/60 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/80'
                              }`}
                            >
                              <span
                                className="mt-1 w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold text-white shadow-sm"
                                style={{ backgroundColor: selectedRoute.color }}
                              >
                                {index + 1}
                              </span>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center flex-wrap gap-1.5">
                                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                    {stop.name}
                                  </span>

                                  {isFirst && (
                                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md">
                                      Başlangıç
                                    </span>
                                  )}

                                  {isLast && (
                                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md">
                                      Son Durak
                                    </span>
                                  )}

                                  {stop.isTransferHub === true && (
                                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 rounded-md">
                                      Aktarma
                                    </span>
                                  )}
                                </div>

                                {stop.description !== undefined && (
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                                    {stop.description}
                                  </p>
                                )}
                              </div>

                              <MapPin
                                className={`w-4 h-4 shrink-0 mt-1.5 ${
                                  isStopSelected
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-slate-300 dark:text-slate-600'
                                }`}
                              />
                            </button>

                            <button
                              type="button"
                              onClick={() => toggleFavoriteStop(stop.id)}
                              aria-label={
                                isStopFav
                                  ? `${stop.name} durağını favorilerden çıkar`
                                  : `${stop.name} durağını favorilere ekle`
                              }
                              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-amber-500 transition-colors shrink-0"
                            >
                              <Star
                                className={`w-4 h-4 ${
                                  isStopFav ? 'fill-amber-400 text-amber-400' : ''
                                }`}
                              />
                            </button>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                </div>
              ) : (
                /* Hat Listesi veya Boş Durum (Empty State) Görünümü */
                <div className="space-y-2.5">
                  {sortedAndFilteredRoutes.length === 0 ? (
                    <div className="text-center py-7 px-4 backdrop-blur-md bg-white/85 dark:bg-slate-800/85 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 space-y-3">
                      <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 flex items-center justify-center mx-auto">
                        <SearchX className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                          Aradığınız durak veya hat bulunamadı
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          &ldquo;Yenişehir&rdquo;, &ldquo;Kampüs&rdquo;, &ldquo;Otogar&rdquo; veya &ldquo;Kaletepe&rdquo; yazarak tekrar deneyebilirsiniz.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearSearchAndFilters}
                        className="min-h-[44px] px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-sm transition-all duration-300 ease-out"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Aradığınız durak bulunamadı, filtreleri temizleyin</span>
                      </button>
                    </div>
                  ) : (
                    sortedAndFilteredRoutes.map((route) => {
                      const isFav = favoriteRouteIds.includes(route.id);
                      const daySchedule = route.schedule[scheduleDayType];
                      return (
                        <div
                          key={route.id}
                          className="w-full min-h-[76px] p-3 rounded-2xl border border-slate-200/90 dark:border-slate-700/90 backdrop-blur-md bg-white/85 dark:bg-slate-800/85 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 ease-out flex items-center justify-between gap-2 shadow-sm"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              selectRoute(route.id);
                              setSearchQuery('');
                            }}
                            className="flex-1 min-h-[56px] text-left flex items-center justify-between gap-3 min-w-0"
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              <span
                                className="px-2.5 py-1.5 rounded-xl text-xs font-extrabold text-white shrink-0 shadow-sm"
                                style={{ backgroundColor: route.color }}
                              >
                                {route.code}
                              </span>

                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                    {route.name}
                                  </h3>
                                  {isFav && (
                                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 rounded">
                                      Sabit
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                                  {route.stops[0]?.name} →{' '}
                                  {route.stops[route.stops.length - 1]?.name}
                                </p>
                                <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                                  <span>Her {daySchedule.frequencyMinutes} dk</span>
                                  <span>•</span>
                                  <span>Son: {daySchedule.lastDeparture}</span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white">
                                {route.price.student} ₺ / {route.price.full} ₺
                              </span>
                              <span className="block text-[10px] text-slate-400 mt-1">
                                Öğrenci / Tam
                              </span>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleFavoriteRoute(route.id)}
                            aria-label={
                              isFav
                                ? `${route.name} hattını favorilerden çıkar`
                                : `${route.name} hattını favorilere sabitle`
                            }
                            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-amber-500 transition-colors shrink-0"
                          >
                            <Star
                              className={`w-5 h-5 ${
                                isFav ? 'fill-amber-400 text-amber-400' : ''
                              }`}
                            />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
};
