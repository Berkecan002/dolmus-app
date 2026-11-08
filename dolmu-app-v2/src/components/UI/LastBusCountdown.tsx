import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Clock, Sparkles } from 'lucide-react';
import type { RouteLine, ScheduleDayType } from '../../types/transport';

interface LastBusCountdownProps {
  route: RouteLine;
  scheduleDayType: ScheduleDayType;
}

interface CountdownCalculation {
  status: 'normal' | 'critical' | 'ended';
  remainingMinutes: number;
  lastDepartureText: string;
  firstDepartureText: string;
}

/**
 * "SS:DD" formatındaki saati bugünün toplam dakikasına çevirir
 */
function parseTimeToMinutes(timeStr: string): number {
  const parts = timeStr.split(':');
  const hours = Number(parts[0] ?? 0);
  const minutes = Number(parts[1] ?? 0);
  return hours * 60 + minutes;
}

function calculateRemainingStatus(
  firstDeparture: string,
  lastDeparture: string,
  nowDate: Date
): CountdownCalculation {
  const nowMinutes = nowDate.getHours() * 60 + nowDate.getMinutes();
  const firstMinutes = parseTimeToMinutes(firstDeparture);
  const lastMinutes = parseTimeToMinutes(lastDeparture);

  if (nowMinutes < firstMinutes || nowMinutes > lastMinutes) {
    return {
      status: 'ended',
      remainingMinutes: 0,
      lastDepartureText: lastDeparture,
      firstDepartureText: firstDeparture,
    };
  }

  const diff = lastMinutes - nowMinutes;
  if (diff <= 60) {
    return {
      status: 'critical',
      remainingMinutes: Math.max(1, diff),
      lastDepartureText: lastDeparture,
      firstDepartureText: firstDeparture,
    };
  }

  return {
    status: 'normal',
    remainingMinutes: diff,
    lastDepartureText: lastDeparture,
    firstDepartureText: firstDeparture,
  };
}

export const LastBusCountdown: React.FC<LastBusCountdownProps> = React.memo(
  ({ route, scheduleDayType }) => {
    const [now, setNow] = useState<Date>(() => new Date());
    const [isSimulatedCritical, setIsSimulatedCritical] = useState<boolean>(false);

    useEffect(() => {
      const intervalId = window.setInterval(() => {
        setNow(new Date());
      }, 15000);

      return () => {
        window.clearInterval(intervalId);
      };
    }, []);

    const activeSchedule = route.schedule[scheduleDayType];

    const calculation = useMemo((): CountdownCalculation => {
      if (isSimulatedCritical) {
        return {
          status: 'critical',
          remainingMinutes: 38,
          lastDepartureText: activeSchedule.lastDeparture,
          firstDepartureText: activeSchedule.firstDeparture,
        };
      }

      return calculateRemainingStatus(
        activeSchedule.firstDeparture,
        activeSchedule.lastDeparture,
        now
      );
    }, [
      activeSchedule.firstDeparture,
      activeSchedule.lastDeparture,
      isSimulatedCritical,
      now,
    ]);

    if (calculation.status === 'critical') {
      const isUrgent = calculation.remainingMinutes <= 20;

      return (
        <div
          role="alert"
          aria-live="polite"
          className={`rounded-2xl p-3.5 border transition-all flex items-center justify-between gap-3 ${
            isUrgent
              ? 'bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-800 text-red-950 dark:text-red-100'
              : 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-100'
          }`}
        >
          <div className="flex items-start gap-2.5 min-w-0">
            <AlertTriangle
              className={`w-5 h-5 shrink-0 mt-0.5 animate-bounce ${
                isUrgent
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            />
            <div className="min-w-0">
              <p className="text-xs font-extrabold leading-snug">
                ⚠️ Son dolmuşun kalkmasına {calculation.remainingMinutes} dakika kaldı!
              </p>
              <p className="text-[11px] opacity-85 mt-0.5">
                {route.code} hattı son sefer saati:{' '}
                <strong>{calculation.lastDepartureText}</strong> (
                {scheduleDayType === 'weekday' ? 'Hafta İçi' : 'Hafta Sonu'})
              </p>
            </div>
          </div>

          {isSimulatedCritical && (
            <button
              type="button"
              onClick={() => setIsSimulatedCritical(false)}
              className="min-h-[44px] px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 shrink-0 border border-amber-300 dark:border-amber-700"
            >
              Simülasyonu Kapat
            </button>
          )}
        </div>
      );
    }

    if (calculation.status === 'ended') {
      return (
        <div className="rounded-2xl p-3 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
            <Clock className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
            <span>
              Bugünkü seferler tamamlandı ({calculation.lastDepartureText}). İlk sefer:{' '}
              <strong>{calculation.firstDepartureText}</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsSimulatedCritical(true)}
            aria-label="Son dolmuş geri sayım uyarısını test et"
            className="min-h-[44px] px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 shrink-0 inline-flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Son 38 dk Testi</span>
          </button>
        </div>
      );
    }

    const hoursLeft = Math.floor(calculation.remainingMinutes / 60);
    const minsLeft = calculation.remainingMinutes % 60;

    return (
      <div className="rounded-2xl px-3.5 py-2.5 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-emerald-900 dark:text-emerald-200">
          <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            Son dolmuşa ({calculation.lastDepartureText}){' '}
            <strong>
              {hoursLeft > 0 ? `${hoursLeft} sa ${minsLeft} dk` : `${minsLeft} dk`}
            </strong>{' '}
            var
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsSimulatedCritical(true)}
          aria-label="Son dolmuş geri sayım uyarısını test et"
          className="min-h-[44px] px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-amber-100/90 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 hover:bg-amber-200 transition-colors shrink-0 inline-flex items-center gap-1"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Uyarıyı Test Et</span>
        </button>
      </div>
    );
  }
);

LastBusCountdown.displayName = 'LastBusCountdown';
