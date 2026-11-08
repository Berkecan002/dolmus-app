import type {
  RouteLine,
  RoutePlanLeg,
  RoutePlanResult,
  Stop,
} from '../types/transport';
import { calculateHaversineDistance } from './geo';

const MINUTES_PER_STOP = 3;
const TRANSFER_WAIT_MINUTES = 5;
const HUB_PROXIMITY_METERS = 150;

/**
 * İki durağın aynı fiziksel aktarma noktası (Örn: Cumhuriyet Meydanı) olup olmadığını kontrol eder
 */
function areStopsSameLocation(stopA: Stop, stopB: Stop): boolean {
  if (stopA.id === stopB.id) {
    return true;
  }
  const normalizedA = stopA.name.trim().toLocaleLowerCase('tr-TR');
  const normalizedB = stopB.name.trim().toLocaleLowerCase('tr-TR');
  if (normalizedA === normalizedB) {
    return true;
  }
  return calculateHaversineDistance(stopA.coordinates, stopB.coordinates) <= HUB_PROXIMITY_METERS;
}

/**
 * Bir hat üzerindeki iki durak indeksinden bacak (leg) bilgisini üretir (Çift yönlü ring desteği ile)
 */
function buildRouteLeg(
  route: RouteLine,
  startIndex: number,
  endIndex: number
): RoutePlanLeg | null {
  const fromStop = route.stops[startIndex];
  const toStop = route.stops[endIndex];
  if (fromStop === undefined || toStop === undefined || startIndex === endIndex) {
    return null;
  }

  const intermediateStops: Stop[] = [];
  if (startIndex < endIndex) {
    for (let i = startIndex + 1; i < endIndex; i++) {
      const stop = route.stops[i];
      if (stop !== undefined) {
        intermediateStops.push(stop);
      }
    }
  } else {
    for (let i = startIndex - 1; i > endIndex; i--) {
      const stop = route.stops[i];
      if (stop !== undefined) {
        intermediateStops.push(stop);
      }
    }
  }

  const stopSpan = Math.abs(endIndex - startIndex);
  return {
    route,
    fromStop,
    toStop,
    intermediateStops,
    estimatedMinutes: Math.max(3, stopSpan * MINUTES_PER_STOP),
  };
}

/**
 * "Nasıl Giderim?" — Başlangıç ve varış durakları arasında doğrudan veya aktarmalı (`isTransferHub: true`) en uygun rotayı bulur
 */
export function findBestRoute(
  fromStop: Stop,
  toStop: Stop,
  routes: RouteLine[]
): RoutePlanResult | null {
  if (areStopsSameLocation(fromStop, toStop)) {
    return null;
  }

  // 1. Adım: Doğrudan (Tek Hat) Ulaşım Kontrolü
  for (const route of routes) {
    const fromIdx = route.stops.findIndex((s) => areStopsSameLocation(s, fromStop));
    const toIdx = route.stops.findIndex((s) => areStopsSameLocation(s, toStop));

    if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) {
      const leg = buildRouteLeg(route, fromIdx, toIdx);
      if (leg !== null) {
        return {
          type: 'direct',
          legs: [leg],
          totalStopsCount: Math.abs(toIdx - fromIdx),
          totalEstimatedMinutes: leg.estimatedMinutes,
          totalStudentPrice: route.price.student,
          totalFullPrice: route.price.full,
        };
      }
    }
  }

  // 2. Adım: Aktarma Noktası (`isTransferHub: true`) Üzerinden 2 Hatlı Ulaşım Kontrolü
  let bestTransferResult: RoutePlanResult | null = null;

  for (const firstRoute of routes) {
    const fromIdx = firstRoute.stops.findIndex((s) =>
      areStopsSameLocation(s, fromStop)
    );
    if (fromIdx === -1) {
      continue;
    }

    for (const secondRoute of routes) {
      if (firstRoute.id === secondRoute.id) {
        continue;
      }

      const toIdx = secondRoute.stops.findIndex((s) =>
        areStopsSameLocation(s, toStop)
      );
      if (toIdx === -1) {
        continue;
      }

      // İlk hattaki aktarma duraklarını (`isTransferHub`) ikinci hattaki duraklarla eşleştir
      for (let hubIdx1 = 0; hubIdx1 < firstRoute.stops.length; hubIdx1++) {
        const hubStop1 = firstRoute.stops[hubIdx1];
        if (hubStop1 === undefined || hubStop1.isTransferHub !== true) {
          continue;
        }

        const hubIdx2 = secondRoute.stops.findIndex((s) =>
          areStopsSameLocation(s, hubStop1)
        );
        if (hubIdx2 === -1 || hubIdx1 === fromIdx || hubIdx2 === toIdx) {
          continue;
        }

        const leg1 = buildRouteLeg(firstRoute, fromIdx, hubIdx1);
        const leg2 = buildRouteLeg(secondRoute, hubIdx2, toIdx);

        if (leg1 !== null && leg2 !== null) {
          const totalStopsCount =
            Math.abs(hubIdx1 - fromIdx) + Math.abs(toIdx - hubIdx2);
          const totalEstimatedMinutes =
            leg1.estimatedMinutes + leg2.estimatedMinutes + TRANSFER_WAIT_MINUTES;

          const candidate: RoutePlanResult = {
            type: 'transfer',
            legs: [leg1, leg2],
            transferStop: hubStop1,
            totalStopsCount,
            totalEstimatedMinutes,
            totalStudentPrice: firstRoute.price.student + secondRoute.price.student,
            totalFullPrice: firstRoute.price.full + secondRoute.price.full,
          };

          if (
            bestTransferResult === null ||
            candidate.totalEstimatedMinutes < bestTransferResult.totalEstimatedMinutes
          ) {
            bestTransferResult = candidate;
          }
        }
      }
    }
  }

  return bestTransferResult;
}

/**
 * Tüm hatlardaki benzersiz durakları tek bir listede toplar (Nereden / Nereye seçicileri için)
 */
export function getUniqueStops(routes: RouteLine[]): Stop[] {
  const uniqueList: Stop[] = [];
  for (const route of routes) {
    for (const stop of route.stops) {
      const alreadyExists = uniqueList.some((existing) =>
        areStopsSameLocation(existing, stop)
      );
      if (!alreadyExists) {
        uniqueList.push(stop);
      }
    }
  }
  return uniqueList;
}
