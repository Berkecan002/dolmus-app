import React, { useEffect, useMemo, useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { KIRIKKALE_CENTER } from '../../data/mockRoutes';
import type { LatLngTuple, RouteLine } from '../../types/transport';

interface SimulatedBusMarkersProps {
  routes: RouteLine[];
}

interface SimulatedVehicle {
  id: string;
  route: RouteLine;
  position: LatLngTuple;
  nextStopName: string;
}

/**
 * Hareketli dolmuş ikonu önbelleği (Bellek sızıntılarını önler)
 */
const busIconCache = new Map<string, L.DivIcon>();

function getBusDivIcon(code: string, color: string): L.DivIcon {
  const cacheKey = `${code}-${color}`;
  const cached = busIconCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const icon = L.divIcon({
    className: 'custom-stop-icon',
    iconSize: [52, 26],
    iconAnchor: [26, 13],
    popupAnchor: [0, -14],
    html: `
      <div
        class="flex items-center justify-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold text-white shadow-lg ring-2 ring-white dark:ring-slate-950 transition-transform"
        style="background-color:${color};"
      >
        <span>🚌</span>
        <span>${code}</span>
      </div>
    `,
  });

  busIconCache.set(cacheKey, icon);
  return icon;
}

/**
 * Rota koordinat dizisi üzerinde 0..1 arası ilerleme değerine göre ara koordinat interpolasyonu yapar
 */
function interpolatePositionOnPath(
  path: LatLngTuple[],
  progress: number
): LatLngTuple {
  const firstPoint = path[0];
  if (firstPoint === undefined) {
    return KIRIKKALE_CENTER;
  }
  if (path.length === 1) {
    return firstPoint;
  }

  // Gidiş-dönüş (ping-pong) hareketi için 0..1 değerini üçgen dalgaya çevir
  const normalized = progress % 1;
  const pingPong =
    normalized <= 0.5 ? normalized * 2 : (1 - normalized) * 2;

  const totalSegments = path.length - 1;
  const exactIndex = pingPong * totalSegments;
  const segmentIndex = Math.min(Math.floor(exactIndex), totalSegments - 1);
  const segmentFraction = exactIndex - segmentIndex;

  const start = path[segmentIndex] ?? firstPoint;
  const end = path[segmentIndex + 1] ?? start;

  const lat = start[0] + (end[0] - start[0]) * segmentFraction;
  const lng = start[1] + (end[1] - start[1]) * segmentFraction;

  return [lat, lng];
}

export const SimulatedBusMarkers: React.FC<SimulatedBusMarkersProps> = React.memo(
  ({ routes }) => {
    const [tick, setTick] = useState<number>(0);

    useEffect(() => {
      const intervalId = window.setInterval(() => {
        setTick((prev) => prev + 1);
      }, 1200);

      return () => {
        window.clearInterval(intervalId);
      };
    }, []);

    const vehicles = useMemo((): SimulatedVehicle[] => {
      const list: SimulatedVehicle[] = [];
      const baseTime = tick * 0.014;

      for (let i = 0; i < routes.length; i++) {
        const route = routes[i];
        if (route === undefined || route.pathCoordinates.length < 2) {
          continue;
        }

        const offsets = [0.15 + i * 0.11, 0.62 + i * 0.09];
        offsets.forEach((offset, vehicleIdx) => {
          const progress = (baseTime + offset) % 1;
          const position = interpolatePositionOnPath(
            route.pathCoordinates,
            progress
          );
          const stopIdx =
            Math.floor(progress * route.stops.length) % route.stops.length;
          const nextStop = route.stops[stopIdx]?.name ?? route.name;

          list.push({
            id: `sim-bus-${route.id}-${vehicleIdx}`,
            route,
            position,
            nextStopName: nextStop,
          });
        });
      }

      return list;
    }, [routes, tick]);

    return (
      <>
        {vehicles.map((vehicle) => {
          const icon = getBusDivIcon(vehicle.route.code, vehicle.route.color);
          return (
            <Marker
              key={vehicle.id}
              position={vehicle.position}
              icon={icon}
            >
              <Popup>
                <div className="p-1 min-w-[165px]">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-bold text-white"
                      style={{ backgroundColor: vehicle.route.color }}
                    >
                      {vehicle.route.code}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-700">
                      Seferde (Simülasyon)
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-900">
                    {vehicle.route.name}
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Yaklaşan Durak: <strong>{vehicle.nextStopName}</strong>
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </>
    );
  }
);

SimulatedBusMarkers.displayName = 'SimulatedBusMarkers';
