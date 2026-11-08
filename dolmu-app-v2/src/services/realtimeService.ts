import type { CrowdLevel, StopLiveReport } from '../types/transport';

const STORAGE_KEY = 'dolmu-app-realtime-reports-v2';
const CHANNEL_NAME = 'dolmu-app-realtime-channel-v2';

/**
 * Bildirimlerin geçerlilik süresi: 15 dakika
 */
export const REPORT_EXPIRY_MS = 15 * 60 * 1000;

interface RealtimeBroadcastMessage {
  type: 'REPORTS_UPDATED';
  reports: Record<string, StopLiveReport>;
  updatedAt: number;
}

type RealtimeListener = (reports: Record<string, StopLiveReport>) => void;

const listeners = new Set<RealtimeListener>();
let broadcastChannel: BroadcastChannel | null = null;

if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
    broadcastChannel.onmessage = (event: MessageEvent<RealtimeBroadcastMessage>) => {
      if (event.data?.type === 'REPORTS_UPDATED' && event.data.reports !== undefined) {
        for (const listener of listeners) {
          listener(event.data.reports);
        }
      }
    };
  } catch {
    broadcastChannel = null;
  }
}

/**
 * Ana duraklarda (A Kapısı, Cumhuriyet Meydanı, Yenişehir, Hastane) gerçekçi başlangıç topluluk bildirimleri üretir
 */
function createSeededReports(nowMs: number): Record<string, StopLiveReport> {
  const fourMinsAgo = nowMs - 4 * 60 * 1000;
  const sixMinsAgo = nowMs - 6 * 60 * 1000;
  const threeMinsAgo = nowMs - 3 * 60 * 1000;
  const eightMinsAgo = nowMs - 8 * 60 * 1000;

  return {
    // Kırıkkale Üniversitesi A Kapısı (YNŞ-1 ve KMP-3 ortak)
    'stop-yns-3': {
      stopId: 'stop-yns-3',
      lastBusPassedAt: fourMinsAgo,
      crowdedReportedAt: sixMinsAgo,
      crowdedCount: 3,
      crowdLevel: 'Orta',
      reporterLabel: 'öğrenci tarafından bildirildi',
    },
    'stop-kmp-6': {
      stopId: 'stop-kmp-6',
      lastBusPassedAt: fourMinsAgo,
      crowdedReportedAt: sixMinsAgo,
      crowdedCount: 3,
      crowdLevel: 'Orta',
      reporterLabel: 'öğrenci tarafından bildirildi',
    },
    // Cumhuriyet Meydanı (Merkez) (YNŞ-1, OTG-2, SNY-4 ortak)
    'stop-yns-7': {
      stopId: 'stop-yns-7',
      lastBusPassedAt: threeMinsAgo,
      crowdedReportedAt: fourMinsAgo,
      crowdedCount: 4,
      crowdLevel: 'Orta',
      reporterLabel: 'öğrenci tarafından bildirildi',
    },
    'stop-otg-1': {
      stopId: 'stop-otg-1',
      lastBusPassedAt: threeMinsAgo,
      crowdedReportedAt: fourMinsAgo,
      crowdedCount: 4,
      crowdLevel: 'Orta',
      reporterLabel: 'öğrenci tarafından bildirildi',
    },
    'stop-sny-1': {
      stopId: 'stop-sny-1',
      lastBusPassedAt: threeMinsAgo,
      crowdedReportedAt: fourMinsAgo,
      crowdedCount: 4,
      crowdLevel: 'Orta',
      reporterLabel: 'öğrenci tarafından bildirildi',
    },
    // Yenişehir Yurtlar Bölgesi
    'stop-yns-1': {
      stopId: 'stop-yns-1',
      lastBusPassedAt: sixMinsAgo,
      crowdedReportedAt: eightMinsAgo,
      crowdedCount: 2,
      crowdLevel: 'Orta',
      reporterLabel: 'öğrenci tarafından bildirildi',
    },
    'stop-kmp-1': {
      stopId: 'stop-kmp-1',
      lastBusPassedAt: sixMinsAgo,
      crowdedReportedAt: eightMinsAgo,
      crowdedCount: 2,
      crowdLevel: 'Orta',
      reporterLabel: 'öğrenci tarafından bildirildi',
    },
    // Yüksek İhtisas Hastanesi
    'stop-otg-3': {
      stopId: 'stop-otg-3',
      lastBusPassedAt: eightMinsAgo,
      crowdedReportedAt: null,
      crowdedCount: 1,
      crowdLevel: 'Düşük',
      reporterLabel: 'yolcu tarafından bildirildi',
    },
  };
}

/**
 * 15 dakikadan eski bildirimleri temizler ve ana durakların başlangıç verilerini taze tutar
 */
export function loadActiveReports(): Record<string, StopLiveReport> {
  const nowMs = Date.now();
  const seeded = createSeededReports(nowMs);

  if (typeof window === 'undefined') {
    return seeded;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }

    const parsed = JSON.parse(raw) as Record<string, StopLiveReport>;
    const validReports: Record<string, StopLiveReport> = { ...seeded };

    for (const [stopId, report] of Object.entries(parsed)) {
      const busValid =
        report.lastBusPassedAt !== null &&
        nowMs - report.lastBusPassedAt <= REPORT_EXPIRY_MS;
      const crowdValid =
        report.crowdedReportedAt !== null &&
        nowMs - report.crowdedReportedAt <= REPORT_EXPIRY_MS;

      if (busValid || crowdValid) {
        validReports[stopId] = {
          stopId,
          lastBusPassedAt: busValid ? report.lastBusPassedAt : null,
          crowdedReportedAt: crowdValid ? report.crowdedReportedAt : null,
          crowdedCount: crowdValid ? report.crowdedCount : 0,
          crowdLevel: crowdValid ? report.crowdLevel : 'Düşük',
          reporterLabel: report.reporterLabel ?? 'öğrenci tarafından bildirildi',
        };
      }
    }

    return validReports;
  } catch {
    return seeded;
  }
}

function saveAndBroadcastReports(reports: Record<string, StopLiveReport>): void {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
    } catch {
      // localStorage kotası dolmuşsa sessizce devam et
    }
  }

  for (const listener of listeners) {
    listener(reports);
  }

  if (broadcastChannel !== null) {
    try {
      const message: RealtimeBroadcastMessage = {
        type: 'REPORTS_UPDATED',
        reports,
        updatedAt: Date.now(),
      };
      broadcastChannel.postMessage(message);
    } catch {
      // BroadcastChannel hatası olursa yoksay
    }
  }
}

export function publishBusPassedReport(
  stopId: string
): Record<string, StopLiveReport> {
  const current = loadActiveReports();
  const existing = current[stopId];
  const nowMs = Date.now();

  const updated: Record<string, StopLiveReport> = {
    ...current,
    [stopId]: {
      stopId,
      lastBusPassedAt: nowMs,
      crowdedReportedAt: existing?.crowdedReportedAt ?? null,
      crowdedCount: existing?.crowdedCount ?? 1,
      crowdLevel: existing?.crowdLevel ?? 'Orta',
      reporterLabel: 'öğrenci tarafından bildirildi',
    },
  };

  saveAndBroadcastReports(updated);
  return updated;
}

export function publishStopCrowdedReport(
  stopId: string
): Record<string, StopLiveReport> {
  const current = loadActiveReports();
  const existing = current[stopId];
  const nowMs = Date.now();
  const nextCount = (existing?.crowdedCount ?? 1) + 1;
  const nextLevel: CrowdLevel = nextCount >= 4 ? 'Yoğun' : 'Orta';

  const updated: Record<string, StopLiveReport> = {
    ...current,
    [stopId]: {
      stopId,
      lastBusPassedAt: existing?.lastBusPassedAt ?? null,
      crowdedReportedAt: nowMs,
      crowdedCount: nextCount,
      crowdLevel: nextLevel,
      reporterLabel: 'öğrenci tarafından bildirildi',
    },
  };

  saveAndBroadcastReports(updated);
  return updated;
}

export function subscribeToRealtimeReports(
  listener: RealtimeListener
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
