import React, { useEffect, useState } from 'react';
import { BusFront, MapPinned, Moon, Sun, WifiOff } from 'lucide-react';
import { MapView } from './components/Map/MapView';
import { BottomSheet } from './components/UI/BottomSheet';
import { ErrorBoundary } from './components/UI/ErrorBoundary';
import { LocationButton } from './components/UI/LocationButton';
import { QuickFilters } from './components/UI/QuickFilters';
import { applyThemeToDom, useThemeStore } from './store/useThemeStore';
import { useTransportStore } from './store/useTransportStore';

export const App: React.FC = () => {
  const routes = useTransportStore((state) => state.routes);
  const selectedRouteId = useTransportStore((state) => state.selectedRouteId);
  const syncFromUrlParams = useTransportStore((state) => state.syncFromUrlParams);

  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isSplashFading, setIsSplashFading] = useState<boolean>(false);
  const [isSplashVisible, setIsSplashVisible] = useState<boolean>(true);

  // İlk açılışta tema sınıfını ve URL paylaşım parametrelerini (?route=...&stop=...) senkronize et
  useEffect(() => {
    applyThemeToDom(theme);
    syncFromUrlParams();
  }, [syncFromUrlParams, theme]);

  // 1 saniyelik karşılama ekranı (Splash / Onboarding) fade-out geçişi
  useEffect(() => {
    const fadeTimerId = window.setTimeout(() => {
      setIsSplashFading(true);
    }, 750);

    const hideTimerId = window.setTimeout(() => {
      setIsSplashVisible(false);
    }, 1150);

    return () => {
      window.clearTimeout(fadeTimerId);
      window.clearTimeout(hideTimerId);
    };
  }, []);

  // Çevrimdışı (Offline) / Çevrimiçi (Online) bağlantı durumunu dinle
  useEffect(() => {
    const handleOnline = (): void => setIsOnline(true);
    const handleOffline = (): void => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const selectedRoute = routes.find((r) => r.id === selectedRouteId) ?? null;

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950 select-none">
      {/* İlk Açılış Karşılama Ekranı (Splash Screen) */}
      {isSplashVisible && (
        <div
          aria-hidden="true"
          className={`fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center px-6 transition-opacity duration-300 ease-out ${
            isSplashFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <div className="w-16 h-16 rounded-3xl bg-blue-600 flex items-center justify-center shadow-2xl shadow-blue-600/40 mb-4 animate-bounce">
            <BusFront className="w-9 h-9 text-white" />
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            Dolmu-app <span className="text-blue-400">v2</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Kırıkkale Şehir İçi Dolmuş &amp; Kampüs Ulaşım Rehberi
          </p>
        </div>
      )}

      {/* Üst Yüzen Başlık Çubuğu (Glassmorphism Header), Hızlı Bölge Rozetleri ve Çevrimdışı Mod Uyarısı */}
      <header className="fixed top-3 inset-x-3 z-20 mx-auto max-w-xl pointer-events-none space-y-2">
        <div className="pointer-events-auto backdrop-blur-md bg-white/85 dark:bg-slate-900/85 text-slate-900 dark:text-white px-3.5 py-2 rounded-2xl shadow-lg border border-slate-200/80 dark:border-slate-800/80 transition-all duration-300 ease-out flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-sm">
              <BusFront className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-extrabold tracking-tight truncate">
                  Dolmu-app
                </h1>
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-500/15 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-400/30 rounded-md">
                  v2 • Kırıkkale
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-300 truncate">
                Şehir İçi Dolmuş &amp; Toplu Taşıma Rehberi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-200">
              <MapPinned className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              <span>
                {selectedRoute !== null
                  ? selectedRoute.code
                  : `${routes.length} Hat Aktif`}
              </span>
            </div>

            {/* Karanlık / Aydınlık Mod Geçiş Butonu (Min 44x44px Touch Target) */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                theme === 'dark'
                  ? 'Aydınlık harita ve temaya geç'
                  : 'Karanlık harita ve temaya geç'
              }
              title={theme === 'dark' ? 'Aydınlık Mod' : 'Karanlık Mod'}
              className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all duration-300 ease-out"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>
          </div>
        </div>

        {/* Kampüs & Kırıkkale Hızlı Erişim Rozetleri */}
        <QuickFilters />

        {/* Çevrimdışı (Offline) Mod Bildirim Rozeti */}
        {!isOnline && (
          <div
            role="status"
            aria-live="polite"
            className="pointer-events-auto backdrop-blur-md bg-amber-500/90 text-slate-950 px-3.5 py-2 rounded-xl shadow-md border border-amber-400 flex items-center justify-center gap-2 text-xs font-bold transition-all duration-300 ease-out"
          >
            <WifiOff className="w-4 h-4 shrink-0" />
            <span>
              Çevrimdışı Mod: Kayıtlı güzergah ve saat verileri gösteriliyor
            </span>
          </div>
        )}
      </header>

      {/* Tam Ekran Leaflet Haritası */}
      <ErrorBoundary>
        <MapView />
      </ErrorBoundary>

      {/* GPS Konum ve En Yakın Durak Hesaplayıcı */}
      <LocationButton />

      {/* Mobil Alt Çekmece (Bottom Sheet) */}
      <BottomSheet />
    </main>
  );
};

export default App;
