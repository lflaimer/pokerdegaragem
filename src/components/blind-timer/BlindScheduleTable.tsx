'use client';

import { BlindLevel } from '@/hooks/useBlindTimer';
import { useLanguage } from '@/contexts/LanguageContext';

interface BlindScheduleTableProps {
  levels: BlindLevel[];
  currentLevelIndex: number;
  onLevelClick?: (index: number) => void;
}

function formatNumber(num: number): string {
  return num.toLocaleString();
}

export function BlindScheduleTable({
  levels,
  currentLevelIndex,
  onLevelClick,
}: BlindScheduleTableProps) {
  const { t } = useLanguage();

  return (
    <div className="bg-white rounded-xl shadow-lg border-2 border-poker-brown/10 overflow-hidden">
      <div className="bg-poker-brown px-4 py-3">
        <h3 className="text-poker-gold font-bold text-lg">{t.blindTimer.blindStructure}</h3>
      </div>
      <div className="overflow-x-auto max-h-96 overflow-y-auto">
        <table className="w-full">
          <thead className="bg-poker-cream sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-poker-brown uppercase tracking-wider">
                {t.blindTimer.level}
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-poker-brown uppercase tracking-wider">
                {t.blindTimer.smallBlind}
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-poker-brown uppercase tracking-wider">
                {t.blindTimer.bigBlind}
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-poker-brown uppercase tracking-wider">
                {t.blindTimer.ante}
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-poker-brown uppercase tracking-wider">
                {t.blindTimer.duration}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-poker-brown/10">
            {levels.map((level, index) => {
              const isCurrent = index === currentLevelIndex;
              const isPast = index < currentLevelIndex;

              return (
                <tr
                  key={index}
                  onClick={() => onLevelClick?.(index)}
                  className={`
                    transition-colors cursor-pointer
                    ${isCurrent ? 'bg-poker-gold/20 font-bold' : ''}
                    ${isPast ? 'text-poker-brown/40' : 'text-poker-brown'}
                    ${!isCurrent && !isPast ? 'hover:bg-poker-gold/10' : ''}
                  `}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      {isCurrent && (
                        <span className="mr-2 text-poker-gold">&#9658;</span>
                      )}
                      {index + 1}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    {formatNumber(level.smallBlind)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    {formatNumber(level.bigBlind)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    {level.ante > 0 ? formatNumber(level.ante) : '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    {level.durationMinutes} {t.blindTimer.minutes}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
