import React, { useCallback } from 'react';
import { AlertCircle, Compass, Loader2, LocateFixed, Navigation, X } from 'lucide-react';
import { KIRIKKALE_CENTER } from '../../data/mockRoutes';
import { useTransportStore } from '../../store/useTransportStore';
import type { LatLngTuple } from '../../types/transport';
import { formatDistance, isWithinKirikkaleBounds } from '../../utils/geo';

export const LocationButton: React.FC = () => {
  const isLocating = useTransportStore((state) => state.isLocating);
  const locationError = useTransportStore((state) => state.locationError);
  const nearestStopMatch = useTransportStore((state) => state.nearestStopMatch);
  const setUserLocation = useTransportStore((state) => state.setUserLocation);
  const setIsLocating = useTransportStore((state) => state.setIsLocating);
  const setLocationError = useTransportStore((state) => state.setLocationError);
  const selectStop = useTransportStore((state) => state.selectStop);
  const clearNearestStopNotification = useTransportStore(
    (state) => state.clearNearestStopNotification
  );

  const handleFindMyLocation = useCallback((): void => {
    if (!('geolocation' in navigator)) {
      setLocationError('Tarayıcınız GPS konum özelliğini desteklemiyor.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: LatLngTuple = [
          position.coords.latitude,
          position.coords.longitude,
        ];
        setIsLocating(false);
        setUserLocation(coords);

        if (!isWithinKirikkaleBounds(coords)) {
          setLocationError(
            'Konumunuz Kırıkkale sınırları dışında görünüyor; yine de size en yakın Kırıkkale durağı hesaplandı.'
          );
        }
      },
      (error) => {
        setIsLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError(
              'Konum izni reddedildi. En yakın durağı bulmak için tarayıcı konum iznini etkinleştirin.'
            );
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('GPS konum bilgisi şu anda alınamıyor.');
            break;
          case error.TIMEOUT:
            setLocationError('Konum alma isteği zaman aşımına uğradı.');
            break;
          default:
            setLocationError('Konum alınırken beklenmeyen bir hata oluştu.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  }, [setIsLocating, setLocationError, setUserLocation]);

  /**
   * Kırıkkale dışında test eden kullanıcılar için tek dokunuşla Kırıkkale Merkez demo konumu
   */
  const handleSimulateKirikkaleLocation = useCallback((): void => {
    const demoCoords: LatLngTuple = [
      KIRIKKALE_CENTER[0] + 0.0022,
      KIRIKKALE_CENTER[1] - 0.0031,
    ];
    setUserLocation(demoCoords);
    setLocationError(null);
  }, [setLocationError, setUserLocation]);

  const handleFocusNearestStop = useCallback((): void => {
    if (nearestStopMatch === null) {
      return;
    }
    selectStop(nearestStopMatch.stop, nearestStopMatch.route.id);
  }, [nearestStopMatch, selectStop]);

  return (
    <>
      {/* Sağ Üst / Harita Üzeri GPS Aksiyon Butonları */}
      <div className="fixed top-36 right-4 z-20 flex flex-col gap-2">
        <button
          type="button"
          onClick={handleFindMyLocation}
          disabled={isLocating}
          aria-label="Konumumu bul ve en yakın durağı hesapla"
          className="min-h-[48px] min-w-[48px] px-3.5 py-2.5 rounded-2xl backdrop-blur-md bg-white/85 dark:bg-slate-900/85 text-slate-900 dark:text-slate-100 shadow-lg border border-slate-200/80 dark:border-slate-700/80 hover:bg-white dark:hover:bg-slate-800 active:scale-95 transition-all duration-300 ease-out flex items-center gap-2 font-semibold text-xs disabled:opacity-60"
        >
          {isLocating ? (
            <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin shrink-0" />
          ) : (
            <LocateFixed className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
          )}
          <span className="hidden sm:inline">En Yakın Durağı Bul</span>
        </button>

        <button
          type="button"
          onClick={handleSimulateKirikkaleLocation}
          aria-label="Kırıkkale merkez örnek konumunu dene"
          title="Kırıkkale Merkez Örnek Konumu"
          className="min-h-[44px] min-w-[44px] px-3 py-2 rounded-2xl backdrop-blur-md bg-slate-900/85 dark:bg-slate-800/85 text-white shadow-md border border-slate-700/80 hover:bg-slate-800 active:scale-95 transition-all duration-300 ease-out flex items-center justify-center gap-1.5 text-[11px] font-medium"
        >
          <Compass className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="hidden sm:inline">Demo Konum</span>
        </button>
      </div>

      {/* En Yakın Durak Bildirim Kartı */}
      {nearestStopMatch !== null && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-36 left-4 right-20 sm:right-auto sm:max-w-sm z-20 backdrop-blur-md bg-white/85 dark:bg-slate-900/85 rounded-2xl shadow-lg border border-blue-200/90 dark:border-blue-800/90 p-3.5 transition-all duration-300 ease-out"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className="px-2 py-0.5 rounded-md text-[11px] font-bold text-white"
                style={{ backgroundColor: nearestStopMatch.route.color }}
              >
                {nearestStopMatch.route.code}
              </span>
              <span className="text-xs font-bold text-blue-700 dark:text-blue-400">
                En Yakın Durak Bulundu
              </span>
            </div>

            <button
              type="button"
              onClick={clearNearestStopNotification}
              aria-label="En yakın durak bildirimini kapat"
              className="min-h-[44px] min-w-[44px] -mt-2 -mr-2 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
            {nearestStopMatch.stop.name}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
            Mesafe:{' '}
            <strong className="text-slate-900 dark:text-white">
              {formatDistance(nearestStopMatch.distanceMeters)}
            </strong>{' '}
            (Yaklaşık {nearestStopMatch.walkingMinutes} dk yürüyüş)
          </p>

          <button
            type="button"
            onClick={handleFocusNearestStop}
            className="mt-2.5 w-full min-h-[44px] px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Durağı ve Hattı Haritada Göster</span>
          </button>
        </div>
      )}

      {/* Konum Hata / Uyarı Bildirimi */}
      {locationError !== null && (
        <div
          role="alert"
          className="fixed top-52 left-4 right-4 sm:max-w-sm z-20 backdrop-blur-md bg-amber-50/90 dark:bg-amber-950/90 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-100 rounded-2xl p-3 shadow-md flex items-start gap-2.5 transition-all duration-300 ease-out"
        >
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed flex-1">{locationError}</p>
          <button
            type="button"
            onClick={() => setLocationError(null)}
            aria-label="Uyarıyı kapat"
            className="min-h-[44px] min-w-[44px] -my-2 -mr-2 flex items-center justify-center text-amber-700 dark:text-amber-300 hover:text-amber-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
};
