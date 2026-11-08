import React, { useMemo, useState } from 'react';
import { Calculator, CheckCircle2, GraduationCap, User } from 'lucide-react';
import type { RouteLine } from '../../types/transport';

interface FareCalculatorProps {
  routes: RouteLine[];
  selectedRoute: RouteLine | null;
}

type PassengerType = 'student' | 'full';

interface FareRow {
  id: string;
  title: string;
  subtitle: string;
  ridesCount: number;
  studentTotal: number;
  fullTotal: number;
}

export const FareCalculator: React.FC<FareCalculatorProps> = React.memo(
  ({ routes, selectedRoute }) => {
    const [activeRouteId, setActiveRouteId] = useState<string>(
      () => selectedRoute?.id ?? routes[0]?.id ?? ''
    );
    const [passengerType, setPassengerType] = useState<PassengerType>('student');
    const [dailyRoundTrips, setDailyRoundTrips] = useState<number>(1); // 1 = Gidiş-Dönüş (2 biniş/gün)

    const currentRoute = useMemo(() => {
      if (selectedRoute !== null) {
        return selectedRoute;
      }
      return routes.find((r) => r.id === activeRouteId) ?? routes[0] ?? null;
    }, [activeRouteId, routes, selectedRoute]);

    const fareRows = useMemo((): FareRow[] => {
      if (currentRoute === null) {
        return [];
      }

      const dailyRides = dailyRoundTrips * 2;
      const weeklyRides = dailyRides * 5;
      const monthlyRides = dailyRides * 20;

      const sPrice = currentRoute.price.student;
      const fPrice = currentRoute.price.full;

      return [
        {
          id: 'daily',
          title: 'Gidiş-Dönüş Günlük',
          subtitle: `Günde ${dailyRides} biniş`,
          ridesCount: dailyRides,
          studentTotal: sPrice * dailyRides,
          fullTotal: fPrice * dailyRides,
        },
        {
          id: 'weekly',
          title: 'Haftalık (5 Gün)',
          subtitle: `Haftada ${weeklyRides} biniş (Pzt-Cum)`,
          ridesCount: weeklyRides,
          studentTotal: sPrice * weeklyRides,
          fullTotal: fPrice * weeklyRides,
        },
        {
          id: 'monthly',
          title: 'Aylık (20 Gün)',
          subtitle: `Ayda ${monthlyRides} biniş (4 Hafta)`,
          ridesCount: monthlyRides,
          studentTotal: sPrice * monthlyRides,
          fullTotal: fPrice * monthlyRides,
        },
      ];
    }, [currentRoute, dailyRoundTrips]);

    if (currentRoute === null) {
      return null;
    }

    const monthlyStudentSaving =
      (currentRoute.price.full - currentRoute.price.student) *
      (dailyRoundTrips * 2 * 20);

    return (
      <div className="rounded-2xl p-4 backdrop-blur-md bg-white/85 dark:bg-slate-900/85 border border-slate-200/90 dark:border-slate-700/90 shadow-sm space-y-3.5 transition-all duration-300 ease-out">
        {/* Başlık ve Hat Seçici */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Dolmuş Ücret &amp; Bakiye Hesaplayıcı
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                {currentRoute.code} • Tek biniş: Öğrenci{' '}
                <strong>{currentRoute.price.student} ₺</strong> / Tam{' '}
                <strong>{currentRoute.price.full} ₺</strong>
              </p>
            </div>
          </div>

          {selectedRoute === null && (
            <select
              aria-label="Ücreti hesaplanacak hattı seçin"
              value={currentRoute.id}
              onChange={(e) => setActiveRouteId(e.target.value)}
              className="min-h-[44px] px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
            >
              {routes.map((route) => (
                <option key={route.id} value={route.id}>
                  {route.code} - {route.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Öğrenci / Tam & Günlük Sefer Sayısı Seçici */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setPassengerType('student')}
            className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
              passengerType === 'student'
                ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                : 'bg-slate-100/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            <GraduationCap className="w-4 h-4 shrink-0" />
            <span>Öğrenci ({currentRoute.price.student} ₺)</span>
          </button>

          <button
            type="button"
            onClick={() => setPassengerType('full')}
            className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
              passengerType === 'full'
                ? 'bg-slate-900 dark:bg-blue-600 text-white border-transparent shadow-sm'
                : 'bg-slate-100/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            <User className="w-4 h-4 shrink-0" />
            <span>Tam ({currentRoute.price.full} ₺)</span>
          </button>
        </div>

        {/* Aktarmalı / Tek Hat Seçimi */}
        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Günlük Kullanım Sıklığı:
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setDailyRoundTrips(1)}
              className={`min-h-[44px] px-2.5 py-1 rounded-lg font-bold transition-colors ${
                dailyRoundTrips === 1
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              1 Gidiş-Dönüş
            </button>
            <button
              type="button"
              onClick={() => setDailyRoundTrips(2)}
              className={`min-h-[44px] px-2.5 py-1 rounded-lg font-bold transition-colors ${
                dailyRoundTrips === 2
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Aktarmalı (4 Biniş)
            </button>
          </div>
        </div>

        {/* Masraf Tablosu */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/90 dark:bg-slate-800/90 text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">
                <th className="py-2.5 px-3">Periyot</th>
                <th className="py-2.5 px-3 text-right">Öğrenci</th>
                <th className="py-2.5 px-3 text-right">Tam</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-slate-700/70 text-xs">
              {fareRows.map((row) => (
                <tr
                  key={row.id}
                  className="bg-white/60 dark:bg-slate-900/60 hover:bg-blue-50/40 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <td className="py-2.5 px-3">
                    <span className="font-bold text-slate-900 dark:text-white block">
                      {row.title}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {row.subtitle}
                    </span>
                  </td>
                  <td
                    className={`py-2.5 px-3 text-right font-extrabold ${
                      passengerType === 'student'
                        ? 'text-blue-600 dark:text-blue-400 text-sm'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {row.studentTotal} ₺
                  </td>
                  <td
                    className={`py-2.5 px-3 text-right font-extrabold ${
                      passengerType === 'full'
                        ? 'text-blue-600 dark:text-blue-400 text-sm'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {row.fullTotal} ₺
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Öğrenci Tasarruf Özeti */}
        <div className="px-3 py-2 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/70 flex items-center gap-2 text-xs text-emerald-900 dark:text-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            Öğrenci tarifesiyle ayda (20 gün) toplam{' '}
            <strong>{monthlyStudentSaving} ₺</strong> avantaj sağlıyorsunuz.
          </span>
        </div>
      </div>
    );
  }
);

FareCalculator.displayName = 'FareCalculator';
