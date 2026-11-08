import React, { useEffect, useState } from 'react';
import {
  Bus,
  Check,
  MessageCircle,
  Share2,
  Star,
  Users,
} from 'lucide-react';
import {
  REPORT_EXPIRY_MS,
  subscribeToRealtimeReports,
} from '../../services/realtimeService';
import { useFavoritesStore } from '../../store/useFavoritesStore';
import { toUrlSlug } from '../../store/useTransportStore';
import type { RouteLine, Stop } from '../../types/transport';

interface StopLiveStatusProps {
  stop: Stop;
  route: RouteLine;
}

/**
 * Geçen süreyi "Az önce" veya "X dk önce öğrenci tarafından bildirildi" formatına dönüştürür
 */
function formatRelativeMinutes(
  timestampMs: number,
  nowMs: number,
  reporterLabel: string
): string {
  const diffMinutes = Math.max(0, Math.floor((nowMs - timestampMs) / 60000));
  if (diffMinutes === 0) {
    return `Az önce ${reporterLabel}`;
  }
  return `${diffMinutes} dk önce ${reporterLabel}`;
}

export const StopLiveStatus: React.FC<StopLiveStatusProps> = React.memo(
  ({ stop, route }) => {
    const liveReportsByStopId = useFavoritesStore(
      (state) => state.liveReportsByStopId
    );
    const favoriteStopIds = useFavoritesStore((state) => state.favoriteStopIds);
    const reportBusJustPassed = useFavoritesStore(
      (state) => state.reportBusJustPassed
    );
    const reportStopCrowded = useFavoritesStore(
      (state) => state.reportStopCrowded
    );
    const syncRealtimeReports = useFavoritesStore(
      (state) => state.syncRealtimeReports
    );
    const toggleFavoriteStop = useFavoritesStore(
      (state) => state.toggleFavoriteStop
    );

    const [nowMs, setNowMs] = useState<number>(() => Date.now());
    const [shareFeedback, setShareFeedback] = useState<string | null>(null);

    // BroadcastChannel üzerinden diğer sekmelerden gelen canlı bildirimleri dinle
    useEffect(() => {
      syncRealtimeReports();
      const unsubscribe = subscribeToRealtimeReports((updatedReports) => {
        syncRealtimeReports(updatedReports);
        setNowMs(Date.now());
      });

      const timerId = window.setInterval(() => {
        setNowMs(Date.now());
      }, 15000);

      return () => {
        unsubscribe();
        window.clearInterval(timerId);
      };
    }, [syncRealtimeReports]);

    useEffect(() => {
      if (shareFeedback === null) {
        return;
      }
      const timeoutId = window.setTimeout(() => {
        setShareFeedback(null);
      }, 3500);
      return () => {
        window.clearTimeout(timeoutId);
      };
    }, [shareFeedback]);

    const report = liveReportsByStopId[stop.id] ?? null;
    const isFavorite = favoriteStopIds.includes(stop.id);
    const reporterLabel =
      report?.reporterLabel ?? 'öğrenci tarafından bildirildi';

    const hasRecentBusPassed =
      report?.lastBusPassedAt !== null &&
      report?.lastBusPassedAt !== undefined &&
      nowMs - report.lastBusPassedAt <= REPORT_EXPIRY_MS;

    const hasRecentCrowded =
      report?.crowdedReportedAt !== null &&
      report?.crowdedReportedAt !== undefined &&
      nowMs - report.crowdedReportedAt <= REPORT_EXPIRY_MS;

    const crowdLevel = hasRecentCrowded ? report.crowdLevel : 'Düşük';

    const buildShareUrl = (): string => {
      const baseUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}${window.location.pathname}`
          : 'https://dolmu-app.kirikkale.tr/';
      const routeSlug = toUrlSlug(route.code);
      const stopSlug = toUrlSlug(stop.name);
      return `${baseUrl}?route=${encodeURIComponent(routeSlug)}&stop=${encodeURIComponent(stopSlug)}`;
    };

    const handleShareStop = async (): Promise<void> => {
      const shareUrl = buildShareUrl();
      const shareTitle = `${route.code} • ${stop.name} Durağı`;
      const shareText = `📍 Kırıkkale ${route.name} (${route.code}) hattı "${stop.name}" durağı konumu ve sefer bilgileri:`;

      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        try {
          await navigator.share({
            title: shareTitle,
            text: shareText,
            url: shareUrl,
          });
          setShareFeedback('Durak bağlantısı paylaşıldı!');
          return;
        } catch {
          // Kullanıcı paylaşım penceresini kapattıysa panoya kopyalamaya geç
        }
      }

      if (
        typeof navigator !== 'undefined' &&
        navigator.clipboard !== undefined &&
        typeof navigator.clipboard.writeText === 'function'
      ) {
        try {
          await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
          setShareFeedback('Bağlantı panoya kopyalandı!');
          return;
        } catch {
          setShareFeedback(shareUrl);
        }
      }
    };

    const handleWhatsAppShare = (): void => {
      const shareUrl = buildShareUrl();
      const message = `📍 *${route.code} (${route.name})* - *${stop.name}* durağındayım. Canlı konum ve saatler: ${shareUrl}`;
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    };

    return (
      <div className="rounded-2xl p-3.5 backdrop-blur-md bg-white/85 dark:bg-slate-900/85 border border-slate-200/90 dark:border-slate-700/90 space-y-3 transition-all duration-300 ease-out">
        {/* Başlık ve Favori Durak Butonu */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
              Canlı Öğrenci Topluluk Bildirimleri (15 dk Aktif)
            </span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
              {stop.name}
            </h4>
          </div>

          <button
            type="button"
            onClick={() => toggleFavoriteStop(stop.id)}
            aria-label={
              isFavorite ? 'Durağı favorilerden çıkar' : 'Durağı favorilere ekle'
            }
            className={`min-h-[44px] min-w-[44px] px-2.5 rounded-xl border inline-flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors ${
              isFavorite
                ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Star
              className={`w-4 h-4 ${
                isFavorite ? 'fill-amber-400 text-amber-500' : ''
              }`}
            />
            <span>{isFavorite ? 'Favori' : 'Yıldızla'}</span>
          </button>
        </div>

        {/* Canlı Durum Rozetleri */}
        <div className="flex flex-wrap gap-2">
          {hasRecentBusPassed && report?.lastBusPassedAt !== null ? (
            <div className="px-2.5 py-1.5 rounded-xl bg-blue-100/90 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-xs font-semibold flex items-center gap-1.5">
              <Bus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>
                🚌 Son geçiş:{' '}
                {formatRelativeMinutes(
                  report.lastBusPassedAt,
                  nowMs,
                  reporterLabel
                )}
              </span>
            </div>
          ) : (
            <div className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-medium flex items-center gap-1.5">
              <Bus className="w-3.5 h-3.5 shrink-0" />
              <span>Son 15 dk içinde geçiş bildirimi yok</span>
            </div>
          )}

          <div
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 ${
              crowdLevel === 'Yoğun'
                ? 'bg-rose-100/90 dark:bg-rose-950/80 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                : crowdLevel === 'Orta'
                  ? 'bg-amber-100/90 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                  : 'bg-emerald-100/80 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
            }`}
          >
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span>
              👥 Durak yoğunluğu: <strong>{crowdLevel}</strong>
              {hasRecentCrowded && report !== null
                ? ` (${report.crowdedCount} bildirim)`
                : ''}
            </span>
          </div>
        </div>

        {/* Hızlı Etkileşim Butonları */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              reportBusJustPassed(stop.id);
              setNowMs(Date.now());
            }}
            className="min-h-[44px] px-3 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-slate-800 active:scale-[0.99] border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <span>🚌 Dolmuş Az Önce Geçti</span>
          </button>

          <button
            type="button"
            onClick={() => {
              reportStopCrowded(stop.id);
              setNowMs(Date.now());
            }}
            className="min-h-[44px] px-3 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-slate-800 active:scale-[0.99] border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <span>👥 Durak Çok Kalabalık / Dolu</span>
          </button>
        </div>

        {/* Durağı / Hattı Paylaş Butonları */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              void handleShareStop();
            }}
            className="flex-1 min-h-[44px] px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
          >
            {shareFeedback !== null ? (
              <>
                <Check className="w-4 h-4 shrink-0" />
                <span>{shareFeedback}</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 shrink-0" />
                <span>📍 Durağı / Hattı Paylaş</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleWhatsAppShare}
            aria-label="WhatsApp ile arkadaşlarına gönder"
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 shadow-sm transition-colors shrink-0"
          >
            <MessageCircle className="w-4 h-4 shrink-0" />
            <span>WhatsApp</span>
          </button>
        </div>
      </div>
    );
  }
);

StopLiveStatus.displayName = 'StopLiveStatus';
