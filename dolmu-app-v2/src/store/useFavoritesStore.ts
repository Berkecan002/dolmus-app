import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  loadActiveReports,
  publishBusPassedReport,
  publishStopCrowdedReport,
} from '../services/realtimeService';
import type { StopLiveReport } from '../types/transport';

interface FavoritesState {
  favoriteRouteIds: string[];
  favoriteStopIds: string[];
  liveReportsByStopId: Record<string, StopLiveReport>;

  // Favori Hat & Durak Eylemleri
  toggleFavoriteRoute: (routeId: string) => void;
  toggleFavoriteStop: (stopId: string) => void;
  isFavoriteRoute: (routeId: string) => boolean;
  isFavoriteStop: (stopId: string) => boolean;

  // Öğrenci Topluluk Bildirim Eylemleri (Sıfır Ayarlı localStorage + BroadcastChannel)
  reportBusJustPassed: (stopId: string) => void;
  reportStopCrowded: (stopId: string) => void;
  syncRealtimeReports: (reports?: Record<string, StopLiveReport>) => void;
  getStopReport: (stopId: string) => StopLiveReport | null;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favoriteRouteIds: ['route-yenisehir-kampus-merkez'],
      favoriteStopIds: ['stop-yns-3', 'stop-yns-7'],
      liveReportsByStopId: loadActiveReports(),

      toggleFavoriteRoute: (routeId: string) => {
        const current = get().favoriteRouteIds;
        const exists = current.includes(routeId);
        const updated = exists
          ? current.filter((id) => id !== routeId)
          : [...current, routeId];
        set({ favoriteRouteIds: updated });
      },

      toggleFavoriteStop: (stopId: string) => {
        const current = get().favoriteStopIds;
        const exists = current.includes(stopId);
        const updated = exists
          ? current.filter((id) => id !== stopId)
          : [...current, stopId];
        set({ favoriteStopIds: updated });
      },

      isFavoriteRoute: (routeId: string): boolean => {
        return get().favoriteRouteIds.includes(routeId);
      },

      isFavoriteStop: (stopId: string): boolean => {
        return get().favoriteStopIds.includes(stopId);
      },

      reportBusJustPassed: (stopId: string) => {
        const updated = publishBusPassedReport(stopId);
        set({ liveReportsByStopId: updated });
      },

      reportStopCrowded: (stopId: string) => {
        const updated = publishStopCrowdedReport(stopId);
        set({ liveReportsByStopId: updated });
      },

      syncRealtimeReports: (reports?: Record<string, StopLiveReport>) => {
        set({
          liveReportsByStopId: reports ?? loadActiveReports(),
        });
      },

      getStopReport: (stopId: string): StopLiveReport | null => {
        return get().liveReportsByStopId[stopId] ?? null;
      },
    }),
    {
      name: 'dolmu-app-favorites-and-reports-v2',
      partialize: (state) => ({
        favoriteRouteIds: state.favoriteRouteIds,
        favoriteStopIds: state.favoriteStopIds,
      }),
    }
  )
);
