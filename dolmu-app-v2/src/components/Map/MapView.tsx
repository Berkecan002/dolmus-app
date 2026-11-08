import React, { useEffect, useMemo } from 'react';
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  DEFAULT_MAP_ZOOM,
  KIRIKKALE_CENTER,
  KIRIKKALE_MAX_BOUNDS,
  MAX_MAP_ZOOM,
  MIN_MAP_ZOOM,
  QUICK_FILTERS,
} from '../../data/mockRoutes';
import { useFavoritesStore } from '../../store/useFavoritesStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useTransportStore } from '../../store/useTransportStore';
import type {
  LatLngTuple,
  MapCameraTarget,
  RouteLine,
  Stop,
  ThemeMode,
} from '../../types/transport';
import { SimulatedBusMarkers } from './SimulatedBusMarkers';

const LIGHT_TILE_URL =
  'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const DARK_TILE_URL =
  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

/**
 * İkon önbelleği (Bellek sızıntılarını ve her render'da yeni L.DivIcon üretimini önler)
 */
const stopIconCache = new Map<string, L.DivIcon>();

function getStopDivIcon(
  color: string,
  isTransferHub: boolean,
  isSelected: boolean,
  theme: ThemeMode
): L.DivIcon {
  const cacheKey = `${color}-${isTransferHub ? 'hub' : 'std'}-${isSelected ? 'sel' : 'norm'}-${theme}`;
  const cached = stopIconCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const size = isSelected ? 30 : isTransferHub ? 24 : 18;
  const isDark = theme === 'dark';

  const ringClass = isSelected
    ? 'ring-4 ring-amber-400 scale-110'
    : isTransferHub
      ? isDark
        ? 'ring-2 ring-white shadow-[0_0_12px_rgba(255,255,255,0.65)]'
        : 'ring-2 ring-slate-900/80'
      : isDark
        ? 'ring-2 ring-slate-950 shadow-[0_0_10px_rgba(255,255,255,0.45)]'
        : 'ring-2 ring-white';

  const innerDotSize = isTransferHub ? 8 : 6;
  const innerDotColor = isDark && !isSelected ? '#0f172a' : '#ffffff';

  const icon = L.divIcon({
    className: 'custom-stop-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)],
    html: `
      <div
        class="flex items-center justify-center rounded-full shadow-md transition-transform duration-200 ${ringClass}"
        style="width:${size}px;height:${size}px;background-color:${color};"
      >
        <span style="width:${innerDotSize}px;height:${innerDotSize}px;border-radius:9999px;background:${innerDotColor};display:block;"></span>
      </div>
    `,
  });

  stopIconCache.set(cacheKey, icon);
  return icon;
}

const USER_LOCATION_ICON: L.DivIcon = L.divIcon({
  className: 'custom-user-icon',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
  html: `
    <div class="relative flex items-center justify-center w-6 h-6">
      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
      <span class="relative inline-flex rounded-full h-4 w-4 bg-blue-600 border-2 border-white shadow-md"></span>
    </div>
  `,
});

interface MapViewportControllerProps {
  selectedRoute: RouteLine | null;
  selectedStop: Stop | null;
  userLocation: LatLngTuple | null;
  cameraTarget: MapCameraTarget | null;
}

/**
 * Seçili durak, hat, hızlı filtre veya kullanıcı konumuna göre harita kamerasını güvenli şekilde yöneten alt bileşen
 */
const MapViewportController: React.FC<MapViewportControllerProps> = React.memo(
  ({ selectedRoute, selectedStop, userLocation, cameraTarget }) => {
    const map = useMap();

    useEffect(() => {
      if (cameraTarget !== null) {
        map.flyTo(cameraTarget.center, cameraTarget.zoom, {
          animate: true,
          duration: 0.85,
        });
      }
    }, [cameraTarget, map]);

    useEffect(() => {
      if (selectedStop !== null) {
        map.flyTo(selectedStop.coordinates, 16, {
          animate: true,
          duration: 0.8,
        });
      }
    }, [map, selectedStop]);

    useEffect(() => {
      if (selectedStop !== null || selectedRoute === null) {
        return;
      }
      if (selectedRoute.pathCoordinates.length > 0) {
        const bounds = L.latLngBounds(selectedRoute.pathCoordinates);
        map.fitBounds(bounds, {
          paddingTopLeft: [30, 110],
          paddingBottomRight: [30, 260],
          maxZoom: 15,
          animate: true,
        });
      }
    }, [map, selectedRoute, selectedStop]);

    useEffect(() => {
      if (userLocation !== null) {
        map.flyTo(userLocation, 15, {
          animate: true,
          duration: 0.9,
        });
      }
    }, [map, userLocation]);

    return null;
  }
);

MapViewportController.displayName = 'MapViewportController';

interface StopMarkerItemProps {
  stop: Stop;
  route: RouteLine;
  displayColor: string;
  isSelected: boolean;
  theme: ThemeMode;
  onSelectStop: (stop: Stop, routeId: string) => void;
}

/**
 * Tekil durak işaretçisi (Gereksiz re-render'ları önlemek için memoize edilmiştir)
 */
const StopMarkerItem: React.FC<StopMarkerItemProps> = React.memo(
  ({ stop, route, displayColor, isSelected, theme, onSelectStop }) => {
    const icon = useMemo(
      () =>
        getStopDivIcon(
          displayColor,
          Boolean(stop.isTransferHub),
          isSelected,
          theme
        ),
      [displayColor, stop.isTransferHub, isSelected, theme]
    );

    const eventHandlers = useMemo(
      () => ({
        click: () => {
          onSelectStop(stop, route.id);
        },
      }),
      [onSelectStop, route.id, stop]
    );

    return (
      <Marker
        position={stop.coordinates}
        icon={icon}
        eventHandlers={eventHandlers}
      >
        <Popup className="rounded-xl">
          <div className="min-w-[185px] p-1">
            <div className="flex items-center gap-1.5 mb-1">
              <span
                className="inline-block px-2 py-0.5 text-[11px] font-bold text-white rounded-md"
                style={{ backgroundColor: route.color }}
              >
                {route.code}
              </span>
              {stop.isTransferHub === true && (
                <span className="inline-block px-1.5 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-800 rounded">
                  Aktarma Durağı
                </span>
              )}
            </div>
            <p className="font-bold text-slate-900 text-sm leading-snug">
              {stop.name}
            </p>
            {stop.description !== undefined && (
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {stop.description}
              </p>
            )}
            <p className="text-[11px] text-slate-400 mt-1.5 font-mono">
              {stop.coordinates[0].toFixed(4)}°K, {stop.coordinates[1].toFixed(4)}°D
            </p>
          </div>
        </Popup>
      </Marker>
    );
  }
);

StopMarkerItem.displayName = 'StopMarkerItem';

export const MapView: React.FC = () => {
  const routes = useTransportStore((state) => state.routes);
  const selectedRouteId = useTransportStore((state) => state.selectedRouteId);
  const selectedStop = useTransportStore((state) => state.selectedStop);
  const activeQuickFilterId = useTransportStore(
    (state) => state.activeQuickFilterId
  );
  const cameraTarget = useTransportStore((state) => state.cameraTarget);
  const userLocation = useTransportStore((state) => state.userLocation);
  const nearestStopMatch = useTransportStore((state) => state.nearestStopMatch);
  const selectStop = useTransportStore((state) => state.selectStop);
  const favoriteRouteIds = useFavoritesStore((state) => state.favoriteRouteIds);
  const theme = useThemeStore((state) => state.theme);

  const isDark = theme === 'dark';

  const selectedRoute = useMemo(
    () => routes.find((r) => r.id === selectedRouteId) ?? null,
    [routes, selectedRouteId]
  );

  // Seçili hat veya hızlı bölge filtresine göre haritada çizilecek hatları belirle
  const visibleRoutes = useMemo((): RouteLine[] => {
    if (selectedRoute !== null) {
      return [selectedRoute];
    }

    if (activeQuickFilterId !== null) {
      const quickFilter = QUICK_FILTERS.find((f) => f.id === activeQuickFilterId);
      if (quickFilter !== undefined) {
        if (quickFilter.onlyFavorites === true) {
          const favRoutes = routes.filter((r) => favoriteRouteIds.includes(r.id));
          return favRoutes.length > 0 ? favRoutes : routes;
        }
        if (quickFilter.routeCodes !== undefined) {
          return routes.filter((r) => quickFilter.routeCodes?.includes(r.code));
        }
      }
    }

    return routes;
  }, [activeQuickFilterId, favoriteRouteIds, routes, selectedRoute]);

  const polylineStylesByRoute = useMemo(() => {
    const map = new Map<
      string,
      { main: L.PathOptions; glow: L.PathOptions | null; displayColor: string }
    >();

    for (const route of routes) {
      const isSelected = selectedRouteId === null || route.id === selectedRouteId;
      const displayColor = isDark ? (route.darkColor ?? route.color) : route.color;

      const glow: L.PathOptions | null = isDark
        ? {
            color: displayColor,
            weight: isSelected ? 12 : 8,
            opacity: isSelected ? 0.28 : 0.15,
            lineCap: 'round',
            lineJoin: 'round',
          }
        : null;

      const main: L.PathOptions = {
        color: displayColor,
        weight: isSelected ? 6 : 4,
        opacity: isSelected ? 0.96 : 0.55,
        lineCap: 'round',
        lineJoin: 'round',
      };

      map.set(route.id, { main, glow, displayColor });
    }
    return map;
  }, [isDark, routes, selectedRouteId]);

  const nearestConnectionPositions = useMemo((): LatLngTuple[] | null => {
    if (userLocation === null || nearestStopMatch === null) {
      return null;
    }
    return [userLocation, nearestStopMatch.stop.coordinates];
  }, [userLocation, nearestStopMatch]);

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={KIRIKKALE_CENTER}
        zoom={DEFAULT_MAP_ZOOM}
        minZoom={MIN_MAP_ZOOM}
        maxZoom={MAX_MAP_ZOOM}
        maxBounds={KIRIKKALE_MAX_BOUNDS}
        maxBoundsViscosity={1.0}
        zoomControl={false}
        className="w-full h-full"
      >
        <TileLayer
          key={theme}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &amp; <a href="https://carto.com/attributions">CARTO</a>'
          url={isDark ? DARK_TILE_URL : LIGHT_TILE_URL}
        />

        <MapViewportController
          selectedRoute={selectedRoute}
          selectedStop={selectedStop}
          userLocation={userLocation}
          cameraTarget={cameraTarget}
        />

        {/* Hat Güzergah Çizgileri (smoothFactor ile yumuşatılmış + Karanlık Mod Glow) */}
        {visibleRoutes.map((route) => {
          const styleBundle = polylineStylesByRoute.get(route.id);
          const mainOptions = styleBundle?.main ?? {
            color: route.color,
            weight: 5,
          };
          const glowOptions = styleBundle?.glow ?? null;

          return (
            <React.Fragment key={`polyline-group-${route.id}`}>
              {glowOptions !== null && (
                <Polyline
                  positions={route.pathCoordinates}
                  pathOptions={glowOptions}
                  smoothFactor={1.6}
                />
              )}
              <Polyline
                positions={route.pathCoordinates}
                pathOptions={mainOptions}
                smoothFactor={1.6}
              />
            </React.Fragment>
          );
        })}

        {/* Durak İşaretçileri (Marker) */}
        {visibleRoutes.map((route) => {
          const displayColor =
            polylineStylesByRoute.get(route.id)?.displayColor ?? route.color;
          return route.stops.map((stop) => (
            <StopMarkerItem
              key={`${route.id}-${stop.id}`}
              stop={stop}
              route={route}
              displayColor={displayColor}
              isSelected={selectedStop?.id === stop.id}
              theme={theme}
              onSelectStop={selectStop}
            />
          ));
        })}

        {/* Hazır Güzergahlar Üzerinde Hareket Eden Simüle Dolmuşlar */}
        <SimulatedBusMarkers routes={visibleRoutes} />

        {/* Kullanıcı Konumu ve En Yakın Durağa Yürüyüş Bağlantısı */}
        {userLocation !== null && (
          <Marker position={userLocation} icon={USER_LOCATION_ICON}>
            <Popup>
              <div className="text-xs font-semibold text-slate-800">
                Mevcut Konumunuz
                <div className="text-[11px] font-normal text-slate-500 mt-0.5">
                  {userLocation[0].toFixed(4)}°K, {userLocation[1].toFixed(4)}°D
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {nearestConnectionPositions !== null && (
          <Polyline
            positions={nearestConnectionPositions}
            pathOptions={{
              color: isDark ? '#60A5FA' : '#3B82F6',
              weight: 3,
              dashArray: '6, 8',
              opacity: 0.9,
            }}
          />
        )}
      </MapContainer>
    </div>
  );
};
