import { create } from 'zustand';
import { MOCK_ROUTES, QUICK_FILTERS } from '../data/mockRoutes';
import type {
  LatLngTuple,
  MapCameraTarget,
  NearestStopMatch,
  RouteLine,
  ScheduleDayType,
  Stop,
} from '../types/transport';
import { findNearestStop } from '../utils/geo';

function getInitialScheduleDayType(): ScheduleDayType {
  const day = new Date().getDay();
  return day === 0 || day === 6 ? 'weekend' : 'weekday';
}

/**
 * Türkçe karakterleri URL dostu slug formatına dönüştürür (Örn: "YNŞ-1" -> "yns-1", "A Kapısı" -> "a-kapisi")
 */
export function toUrlSlug(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase('tr-TR')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface TransportState {
  routes: RouteLine[];
  selectedRouteId: string | null;
  selectedStop: Stop | null;
  activeQuickFilterId: string | null;
  cameraTarget: MapCameraTarget | null;
  userLocation: LatLngTuple | null;
  nearestStopMatch: NearestStopMatch | null;
  searchQuery: string;
  scheduleDayType: ScheduleDayType;
  isBottomSheetOpen: boolean;
  isLocating: boolean;
  locationError: string | null;

  // Eylemler (Actions)
  selectRoute: (routeId: string | null) => void;
  selectStop: (stop: Stop | null, routeId?: string) => void;
  applyQuickFilter: (filterId: string | null) => void;
  flyToCamera: (center: LatLngTuple, zoom: number) => void;
  setSearchQuery: (query: string) => void;
  setScheduleDayType: (dayType: ScheduleDayType) => void;
  setUserLocation: (coords: LatLngTuple | null) => void;
  setIsLocating: (isLocating: boolean) => void;
  setLocationError: (error: string | null) => void;
  setBottomSheetOpen: (isOpen: boolean) => void;
  clearNearestStopNotification: () => void;
  syncFromUrlParams: () => void;
}

export const useTransportStore = create<TransportState>((set, get) => ({
  routes: MOCK_ROUTES,
  selectedRouteId: MOCK_ROUTES[0]?.id ?? null,
  selectedStop: null,
  activeQuickFilterId: null,
  cameraTarget: null,
  userLocation: null,
  nearestStopMatch: null,
  searchQuery: '',
  scheduleDayType: getInitialScheduleDayType(),
  isBottomSheetOpen: true,
  isLocating: false,
  locationError: null,

  selectRoute: (routeId: string | null) => {
    set({
      selectedRouteId: routeId,
      selectedStop: null,
      activeQuickFilterId: null,
      isBottomSheetOpen: true,
    });
  },

  selectStop: (stop: Stop | null, routeId?: string) => {
    const currentRouteId = get().selectedRouteId;
    set({
      selectedStop: stop,
      selectedRouteId: routeId !== undefined ? routeId : currentRouteId,
      isBottomSheetOpen: true,
    });
  },

  applyQuickFilter: (filterId: string | null) => {
    if (filterId === null) {
      set({
        activeQuickFilterId: null,
        selectedRouteId: null,
        selectedStop: null,
      });
      return;
    }

    const filter = QUICK_FILTERS.find((f) => f.id === filterId);
    if (filter === undefined) {
      return;
    }

    const { routes } = get();
    let nextSelectedRouteId: string | null = null;
    if (filter.routeCodes !== undefined && filter.routeCodes.length === 1) {
      const singleCode = filter.routeCodes[0];
      const matched = routes.find((r) => r.code === singleCode);
      nextSelectedRouteId = matched?.id ?? null;
    }

    set({
      activeQuickFilterId: filterId,
      selectedRouteId: nextSelectedRouteId,
      selectedStop: null,
      cameraTarget: {
        center: filter.center,
        zoom: filter.zoom,
        timestamp: Date.now(),
      },
    });
  },

  flyToCamera: (center: LatLngTuple, zoom: number) => {
    set({
      cameraTarget: {
        center,
        zoom,
        timestamp: Date.now(),
      },
    });
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  setScheduleDayType: (dayType: ScheduleDayType) => {
    set({ scheduleDayType: dayType });
  },

  setUserLocation: (coords: LatLngTuple | null) => {
    if (coords === null) {
      set({ userLocation: null, nearestStopMatch: null });
      return;
    }

    const { routes } = get();
    const nearestMatch = findNearestStop(coords, routes);

    set({
      userLocation: coords,
      nearestStopMatch: nearestMatch,
      locationError: null,
    });
  },

  setIsLocating: (isLocating: boolean) => {
    set({ isLocating });
  },

  setLocationError: (error: string | null) => {
    set({ locationError: error, isLocating: false });
  },

  setBottomSheetOpen: (isOpen: boolean) => {
    set({ isBottomSheetOpen: isOpen });
  },

  clearNearestStopNotification: () => {
    set({ nearestStopMatch: null });
  },

  syncFromUrlParams: () => {
    if (typeof window === 'undefined') {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const routeParam = params.get('route');
    const stopParam = params.get('stop');

    if (routeParam === null && stopParam === null) {
      return;
    }

    const { routes } = get();
    let matchedRoute: RouteLine | undefined;
    let matchedStop: Stop | undefined;

    if (routeParam !== null) {
      const targetRouteSlug = toUrlSlug(routeParam);
      matchedRoute = routes.find(
        (r) =>
          toUrlSlug(r.id) === targetRouteSlug ||
          toUrlSlug(r.code) === targetRouteSlug ||
          toUrlSlug(r.name).includes(targetRouteSlug)
      );
    }

    if (stopParam !== null) {
      const targetStopSlug = toUrlSlug(stopParam);
      const searchPool = matchedRoute !== undefined ? [matchedRoute] : routes;

      for (const route of searchPool) {
        const found = route.stops.find(
          (s) =>
            toUrlSlug(s.id) === targetStopSlug ||
            toUrlSlug(s.name).includes(targetStopSlug)
        );
        if (found !== undefined) {
          matchedStop = found;
          if (matchedRoute === undefined) {
            matchedRoute = route;
          }
          break;
        }
      }
    }

    if (matchedRoute !== undefined || matchedStop !== undefined) {
      set({
        selectedRouteId: matchedRoute?.id ?? get().selectedRouteId,
        selectedStop: matchedStop ?? null,
        isBottomSheetOpen: true,
      });
    }
  },
}));
