/**
 * Coğrafi koordinat tipi: [enlem (latitude), boylam (longitude)]
 * Kırıkkale sınırları: Enlem ~39.80 - 39.88 N, Boylam ~33.40 - 33.58 E
 */
export type LatLngTuple = [number, number];

/**
 * Uygulama tema modu
 */
export type ThemeMode = 'light' | 'dark';

/**
 * Sefer takvimi gün tipi (Hafta içi / Hafta sonu)
 */
export type ScheduleDayType = 'weekday' | 'weekend';

/**
 * Durak yoğunluk seviyesi
 */
export type CrowdLevel = 'Düşük' | 'Orta' | 'Yoğun';

/**
 * Durak (Stop) veri modeli
 */
export interface Stop {
  id: string;
  name: string;
  coordinates: [number, number];
  isTransferHub?: boolean;
  description?: string;
}

/**
 * Ücret tarifesi modeli
 */
export interface RoutePrice {
  student: number;
  full: number;
}

/**
 * Günlük sefer saatleri ve sıklık dilimi
 */
export interface DailySchedule {
  firstDeparture: string;
  lastDeparture: string;
  frequencyMinutes: number;
}

/**
 * Sefer saatleri ve sıklık modeli (Hafta içi & Hafta sonu ayrımlı)
 */
export interface RouteSchedule {
  firstDeparture: string;
  lastDeparture: string;
  frequencyMinutes: number;
  weekday: DailySchedule;
  weekend: DailySchedule;
}

/**
 * Dolmuş / Toplu Taşıma Hattı (RouteLine) veri modeli
 */
export interface RouteLine {
  id: string;
  code: string;
  name: string;
  color: string;
  darkColor?: string;
  price: RoutePrice;
  schedule: RouteSchedule;
  pathCoordinates: [number, number][];
  stops: Stop[];
}

/**
 * Kullanıcının konumuna göre hesaplanan en yakın durak sonucu
 */
export interface NearestStopMatch {
  stop: Stop;
  route: RouteLine;
  distanceMeters: number;
  walkingMinutes: number;
}

/**
 * Rota / Aktarma Bulucu ("Nasıl Giderim?") tekil bacak (leg) bilgisi
 */
export interface RoutePlanLeg {
  route: RouteLine;
  fromStop: Stop;
  toStop: Stop;
  intermediateStops: Stop[];
  estimatedMinutes: number;
}

/**
 * Rota / Aktarma Bulucu sonucu
 */
export interface RoutePlanResult {
  type: 'direct' | 'transfer';
  legs: RoutePlanLeg[];
  transferStop?: Stop;
  totalStopsCount: number;
  totalEstimatedMinutes: number;
  totalStudentPrice: number;
  totalFullPrice: number;
}

/**
 * Öğrenci topluluk canlı durak bildirimi modeli (15 dk geçerlilik süreli)
 */
export interface StopLiveReport {
  stopId: string;
  lastBusPassedAt: number | null;
  crowdedReportedAt: number | null;
  crowdedCount: number;
  crowdLevel: CrowdLevel;
  reporterLabel?: string;
}

/**
 * Harita üstü hızlı bölge/kategori filtresi modeli
 */
export interface QuickFilterItem {
  id: string;
  label: string;
  center: LatLngTuple;
  zoom: number;
  routeCodes?: string[];
  onlyFavorites?: boolean;
}

/**
 * Harita kamerası odaklanma hedefi
 */
export interface MapCameraTarget {
  center: LatLngTuple;
  zoom: number;
  timestamp: number;
}
