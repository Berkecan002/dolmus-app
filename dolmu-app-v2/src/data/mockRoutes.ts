import type { LatLngTuple, QuickFilterItem, RouteLine } from '../types/transport';

/**
 * Kırıkkale Cumhuriyet Meydanı (Merkez) başlangıç koordinatı
 */
export const KIRIKKALE_CENTER: LatLngTuple = [39.8468, 33.5153];

/**
 * Harita varsayılan yakınlaştırma (zoom) değerleri
 */
export const DEFAULT_MAP_ZOOM = 13;
export const MIN_MAP_ZOOM = 12;
export const MAX_MAP_ZOOM = 18;

/**
 * Kırıkkale sınırları (Güneybatı ve Kuzeydoğu köşeleri)
 * Enlem: 39.80 - 39.88 N | Boylam: 33.40 - 33.58 E
 */
export const KIRIKKALE_MAX_BOUNDS: [LatLngTuple, LatLngTuple] = [
  [39.80, 33.40], // Güneybatı (SW)
  [39.88, 33.58], // Kuzeydoğu (NE)
];

/**
 * Kampüs & Kırıkkale Hızlı Erişim Rozetleri
 */
export const QUICK_FILTERS: QuickFilterItem[] = [
  {
    id: 'filter-kampus',
    label: '🎓 Kampüs / A Kapısı',
    center: [39.8715, 33.4595],
    zoom: 15,
    routeCodes: ['YNŞ-1', 'KMP-3'],
  },
  {
    id: 'filter-yenisehir',
    label: '🏘️ Yenişehir',
    center: [39.8665, 33.4535],
    zoom: 15,
    routeCodes: ['YNŞ-1', 'KMP-3'],
  },
  {
    id: 'filter-merkez',
    label: '🏙️ Cumhuriyet Meydanı',
    center: [39.8468, 33.5153],
    zoom: 15,
    routeCodes: ['YNŞ-1', 'OTG-2', 'SNY-4'],
  },
  {
    id: 'filter-otogar-hastane',
    label: '🚌 Otogar & Hastane',
    center: [39.8445, 33.5335],
    zoom: 14,
    routeCodes: ['OTG-2'],
  },
  {
    id: 'filter-favoriler',
    label: '⭐ Favorilerim',
    center: [39.8468, 33.5153],
    zoom: 13,
    onlyFavorites: true,
  },
];

/**
 * Kırıkkale Şehir İçi 4 Hazır Dolmuş Hattı (Doğal Ara Koordinatlarla Yumuşatılmış)
 * Tüm koordinatlar [enlem, boylam] formatında ve Kırıkkale sınırları (39.80-39.88 N, 33.40-33.58 E) içindedir.
 */
export const MOCK_ROUTES: RouteLine[] = [
  {
    id: 'route-yenisehir-kampus-merkez',
    code: 'YNŞ-1',
    name: 'Yenişehir - Kampüs - Merkez',
    color: '#2563EB', // Royal Blue
    darkColor: '#60A5FA', // Bright Sky Blue
    price: {
      student: 18,
      full: 25,
    },
    schedule: {
      firstDeparture: '06:30',
      lastDeparture: '23:30',
      frequencyMinutes: 6,
      weekday: {
        firstDeparture: '06:30',
        lastDeparture: '23:30',
        frequencyMinutes: 6,
      },
      weekend: {
        firstDeparture: '07:15',
        lastDeparture: '23:00',
        frequencyMinutes: 10,
      },
    },
    pathCoordinates: [
      [39.8652, 33.4518], // Yenişehir Yurtlar Bölgesi
      [39.8663, 33.4531],
      [39.8674, 33.4545], // Yenişehir Çarşı
      [39.8691, 33.4562],
      [39.8705, 33.4578],
      [39.8715, 33.4595], // Kırıkkale Üniversitesi A Kapısı
      [39.8698, 33.4628],
      [39.8672, 33.4675],
      [39.8640, 33.4730], // KKÜ Tıp Fakültesi Hastanesi
      [39.8618, 33.4778],
      [39.8595, 33.4825], // Yahşihan Köprülü Kavşağı
      [39.8568, 33.4878],
      [39.8542, 33.4935],
      [39.8515, 33.4995], // Nokta AVM / Valilik Kavşağı
      [39.8495, 33.5052],
      [39.8475, 33.5112], // Belediye / Zafer Caddesi
      [39.8471, 33.5134],
      [39.8468, 33.5153], // Cumhuriyet Meydanı (Merkez)
    ],
    stops: [
      {
        id: 'stop-yns-1',
        name: 'Yenişehir Yurtlar Bölgesi',
        coordinates: [39.8652, 33.4518],
        isTransferHub: true,
        description: 'KYK öğrenci yurtları ve kafeler caddesi kalkış durağı.',
      },
      {
        id: 'stop-yns-2',
        name: 'Yenişehir Çarşı Merkez',
        coordinates: [39.8674, 33.4545],
        isTransferHub: false,
        description: 'Yenişehir öğrenci apartları ve marketler durağı.',
      },
      {
        id: 'stop-yns-3',
        name: 'Kırıkkale Üniversitesi A Kapısı',
        coordinates: [39.8715, 33.4595],
        isTransferHub: true,
        description: 'Üniversite ana giriş kapısı ve kampüs içi ring aktarma noktası.',
      },
      {
        id: 'stop-yns-4',
        name: 'KKÜ Tıp Fakültesi Hastanesi',
        coordinates: [39.8640, 33.4730],
        isTransferHub: true,
        description: 'Tıp Fakültesi Hastanesi acil servis ve poliklinikler önü.',
      },
      {
        id: 'stop-yns-5',
        name: 'Yahşihan Köprülü Kavşağı',
        coordinates: [39.8595, 33.4825],
        isTransferHub: false,
        description: 'Yahşihan ilçe merkezi ve Ankara yolu bağlantı kavşağı.',
      },
      {
        id: 'stop-yns-6',
        name: 'Nokta AVM / Valilik Kavşağı',
        coordinates: [39.8515, 33.4995],
        isTransferHub: true,
        description: 'Kırıkkale Valiliği ve alışveriş merkezi geçiş durağı.',
      },
      {
        id: 'stop-yns-7',
        name: 'Cumhuriyet Meydanı (Merkez)',
        coordinates: [39.8468, 33.5153],
        isTransferHub: true,
        description: 'Kırıkkale şehir merkezi ana aktarma ve toplanma meydanı.',
      },
    ],
  },
  {
    id: 'route-merkez-otogar-baglarbasi',
    code: 'OTG-2',
    name: 'Merkez - Otogar - Bağlarbaşı',
    color: '#059669', // Emerald Green
    darkColor: '#34D399', // Bright Emerald
    price: {
      student: 16,
      full: 22,
    },
    schedule: {
      firstDeparture: '06:15',
      lastDeparture: '22:45',
      frequencyMinutes: 10,
      weekday: {
        firstDeparture: '06:15',
        lastDeparture: '22:45',
        frequencyMinutes: 10,
      },
      weekend: {
        firstDeparture: '07:00',
        lastDeparture: '22:15',
        frequencyMinutes: 15,
      },
    },
    pathCoordinates: [
      [39.8468, 33.5153], // Cumhuriyet Meydanı (Merkez)
      [39.8461, 33.5172],
      [39.8452, 33.5192], // Zafer Caddesi / Hüseyin Kahya Parkı
      [39.8472, 33.5245],
      [39.8495, 33.5305],
      [39.8512, 33.5362], // Yüksek İhtisas Hastanesi
      [39.8465, 33.5348],
      [39.8412, 33.5328],
      [39.8365, 33.5310], // Kırıkkale Şehirlerarası Otogar
      [39.8435, 33.5355],
      [39.8525, 33.5382],
      [39.8582, 33.5405], // Bağlarbaşı Meydan
      [39.8602, 33.5422],
      [39.8620, 33.5440], // Bağlarbaşı Son Durak
    ],
    stops: [
      {
        id: 'stop-otg-1',
        name: 'Cumhuriyet Meydanı (Merkez)',
        coordinates: [39.8468, 33.5153],
        isTransferHub: true,
        description: 'Tüm mahalle ve kampüs hatlarına ana aktarma merkezi.',
      },
      {
        id: 'stop-otg-2',
        name: 'Zafer Caddesi / Kahya Parkı',
        coordinates: [39.8452, 33.5192],
        isTransferHub: false,
        description: 'Zafer Caddesi yürüyüş yolu ve çarşı merkez durağı.',
      },
      {
        id: 'stop-otg-3',
        name: 'Yüksek İhtisas Hastanesi',
        coordinates: [39.8512, 33.5362],
        isTransferHub: true,
        description: 'Kırıkkale Yüksek İhtisas Hastanesi poliklinikler giriş kapısı.',
      },
      {
        id: 'stop-otg-4',
        name: 'Kırıkkale Şehirlerarası Otogar',
        coordinates: [39.8365, 33.5310],
        isTransferHub: true,
        description: 'Şehirlerarası otobüs terminali peron çıkışları aktarma durağı.',
      },
      {
        id: 'stop-otg-5',
        name: 'Bağlarbaşı Meydan',
        coordinates: [39.8582, 33.5405],
        isTransferHub: false,
        description: 'Bağlarbaşı Mahallesi semt pazarı ve merkez camii durağı.',
      },
      {
        id: 'stop-otg-6',
        name: 'Bağlarbaşı Son Durak',
        coordinates: [39.8620, 33.5440],
        isTransferHub: false,
        description: 'Bağlarbaşı Mahallesi üst kısım hareket merkezi.',
      },
    ],
  },
  {
    id: 'route-yenisehir-kampus-ring',
    code: 'KMP-3',
    name: 'Yenişehir - Kampüs İçi Ring',
    color: '#7C3AED', // Vivid Violet
    darkColor: '#A78BFA', // Bright Violet
    price: {
      student: 12,
      full: 18,
    },
    schedule: {
      firstDeparture: '07:30',
      lastDeparture: '22:00',
      frequencyMinutes: 5,
      weekday: {
        firstDeparture: '07:30',
        lastDeparture: '22:00',
        frequencyMinutes: 5,
      },
      weekend: {
        firstDeparture: '08:30',
        lastDeparture: '20:30',
        frequencyMinutes: 15,
      },
    },
    pathCoordinates: [
      [39.8652, 33.4518], // Yenişehir Yurtlar Bölgesi
      [39.8668, 33.4495],
      [39.8685, 33.4475], // Yenişehir Merkez / B Kapısı Yolu
      [39.8712, 33.4468],
      [39.8738, 33.4482], // Kampüs B Kapısı
      [39.8755, 33.4508],
      [39.8768, 33.4535], // Mühendislik Fakültesi
      [39.8762, 33.4562],
      [39.8750, 33.4582], // Merkez Kütüphane & Rektörlük
      [39.8734, 33.4590], // İİBF / Fen Edebiyat
      [39.8715, 33.4595], // Kırıkkale Üniversitesi A Kapısı
    ],
    stops: [
      {
        id: 'stop-kmp-1',
        name: 'Yenişehir Yurtlar Bölgesi',
        coordinates: [39.8652, 33.4518],
        isTransferHub: true,
        description: 'Yenişehir öğrenci yurtları ring başlangıç durağı.',
      },
      {
        id: 'stop-kmp-2',
        name: 'Kampüs B Kapısı Girişi',
        coordinates: [39.8738, 33.4482],
        isTransferHub: false,
        description: 'Kırıkkale Üniversitesi B Kapısı ve spor tesisleri girişi.',
      },
      {
        id: 'stop-kmp-3',
        name: 'Mühendislik Fakültesi',
        coordinates: [39.8768, 33.4535],
        isTransferHub: false,
        description: 'Mühendislik ve Doğa Bilimleri Fakültesi derslikler önü.',
      },
      {
        id: 'stop-kmp-4',
        name: 'Merkez Kütüphane & yemekhane',
        coordinates: [39.8750, 33.4582],
        isTransferHub: false,
        description: 'Üniversite merkez kütüphanesi, rektörlük ve öğrenci yemekhanesi.',
      },
      {
        id: 'stop-kmp-5',
        name: 'İktisadi ve İdari Bilimler (İİBF)',
        coordinates: [39.8734, 33.4590],
        isTransferHub: false,
        description: 'İİBF, Hukuk ve Fen-Edebiyat fakülteleri ortak durağı.',
      },
      {
        id: 'stop-kmp-6',
        name: 'Kırıkkale Üniversitesi A Kapısı',
        coordinates: [39.8715, 33.4595],
        isTransferHub: true,
        description: 'A Kapısı ana çıkış ve Merkez (YNŞ-1) dolmuşlarına aktarma durağı.',
      },
    ],
  },
  {
    id: 'route-merkez-sanayi-kaletepe',
    code: 'SNY-4',
    name: 'Merkez - Sanayi - Kaletepe',
    color: '#EA580C', // Warm Orange
    darkColor: '#FB923C', // Bright Orange
    price: {
      student: 16,
      full: 22,
    },
    schedule: {
      firstDeparture: '06:30',
      lastDeparture: '22:30',
      frequencyMinutes: 10,
      weekday: {
        firstDeparture: '06:30',
        lastDeparture: '22:30',
        frequencyMinutes: 10,
      },
      weekend: {
        firstDeparture: '07:15',
        lastDeparture: '21:45',
        frequencyMinutes: 15,
      },
    },
    pathCoordinates: [
      [39.8468, 33.5153], // Cumhuriyet Meydanı (Merkez)
      [39.8448, 33.5118],
      [39.8432, 33.5082], // TCDD Kırıkkale Garı / İstasyon
      [39.8415, 33.5040],
      [39.8398, 33.4995], // Yeni Sanayi Sitesi
      [39.8435, 33.4975],
      [39.8482, 33.4985],
      [39.8515, 33.4995], // Nokta AVM / Valilik Kavşağı
      [39.8558, 33.5042],
      [39.8595, 33.5085], // Kaletepe Meydan
      [39.8632, 33.5125], // Kaletepe Son Durak
    ],
    stops: [
      {
        id: 'stop-sny-1',
        name: 'Cumhuriyet Meydanı (Merkez)',
        coordinates: [39.8468, 33.5153],
        isTransferHub: true,
        description: 'Şehir merkezi ana kalkış ve aktarma durağı.',
      },
      {
        id: 'stop-sny-2',
        name: 'Kırıkkale Tren Garı (İstasyon)',
        coordinates: [39.8432, 33.5082],
        isTransferHub: false,
        description: 'TCDD Kırıkkale Tren İstasyonu ve İstasyon Caddesi durağı.',
      },
      {
        id: 'stop-sny-3',
        name: 'Yeni Sanayi Sitesi Girişi',
        coordinates: [39.8398, 33.4995],
        isTransferHub: false,
        description: 'Yeni Sanayi Sitesi esnaf ve çıraklık okulu durağı.',
      },
      {
        id: 'stop-sny-4',
        name: 'Nokta AVM / Valilik Kavşağı',
        coordinates: [39.8515, 33.4995],
        isTransferHub: true,
        description: 'Kampüs (YNŞ-1) hattına geçiş yapılabilen kavşak durağı.',
      },
      {
        id: 'stop-sny-5',
        name: 'Kaletepe Mahallesi Meydan',
        coordinates: [39.8595, 33.5085],
        isTransferHub: false,
        description: 'Kaletepe Mahallesi muhtarlık ve aile sağlığı merkezi önü.',
      },
      {
        id: 'stop-sny-6',
        name: 'Kaletepe Son Durak',
        coordinates: [39.8632, 33.5125],
        isTransferHub: false,
        description: 'Kaletepe konutları son hareket noktası.',
      },
    ],
  },
];
