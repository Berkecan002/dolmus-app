import type { LatLngTuple, NearestStopMatch, RouteLine } from '../types/transport';
import { KIRIKKALE_MAX_BOUNDS } from '../data/mockRoutes';

const EARTH_RADIUS_METERS = 6371000;
const AVERAGE_WALKING_SPEED_METERS_PER_MIN = 80; // ~4.8 km/saat yürüyüş hızı

/**
 * Dereceyi radyana çeviren yardımcı fonksiyon
 */
function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Haversine formülü ile iki koordinat [lat, lng] arasındaki kuş uçuşu mesafeyi metre cinsinden hesaplar.
 */
export function calculateHaversineDistance(
  coord1: LatLngTuple,
  coord2: LatLngTuple
): number {
  const [lat1, lng1] = coord1;
  const [lat2, lng2] = coord2;

  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const rLat1 = toRadians(lat1);
  const rLat2 = toRadians(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(EARTH_RADIUS_METERS * c);
}

/**
 * Verilen koordinatın Kırıkkale sınırları (39.80 - 39.88 N, 33.40 - 33.58 E) içinde olup olmadığını kontrol eder.
 */
export function isWithinKirikkaleBounds(coord: LatLngTuple): boolean {
  const [lat, lng] = coord;
  const [[minLat, minLng], [maxLat, maxLng]] = KIRIKKALE_MAX_BOUNDS;
  return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
}

/**
 * Kullanıcının konumuna göre tüm hatlar içerisindeki en yakın durağı Haversine formülüyle bulur.
 */
export function findNearestStop(
  userCoords: LatLngTuple,
  routes: RouteLine[]
): NearestStopMatch | null {
  let closestMatch: NearestStopMatch | null = null;

  for (const route of routes) {
    for (const stop of route.stops) {
      const distanceMeters = calculateHaversineDistance(userCoords, stop.coordinates);
      if (closestMatch === null || distanceMeters < closestMatch.distanceMeters) {
        const walkingMinutes = Math.max(
          1,
          Math.ceil(distanceMeters / AVERAGE_WALKING_SPEED_METERS_PER_MIN)
        );
        closestMatch = {
          stop,
          route,
          distanceMeters,
          walkingMinutes,
        };
      }
    }
  }

  return closestMatch;
}

/**
 * Metre cinsinden mesafeyi kullanıcı dostu metne dönüştürür (Örn: "340 m" veya "1.4 km")
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}
