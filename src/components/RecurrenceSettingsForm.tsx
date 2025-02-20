import { useState } from 'react';
import { RRule, Frequency, Weekday } from 'rrule';

// カスタムOptions型を定義
interface RRuleOptions {
  freq: Frequency;
  interval?: number;
  dtstart?: Date;
  until?: Date;
  byweekday?: Weekday[];
  wkst?: number;
  count?: number;
}

interface RecurrenceSettingsFormProps {
  value?: string;
  onChange: (rrule: string | null) => void;
}

export const RecurrenceSettingsForm = ({
  value,
  onChange
}: RecurrenceSettingsFormProps) => {
  const [frequency, setFrequency] = useState<Frequency>(() => {
    if (value) {
      const rule = RRule.fromString(value);
      return (rule as unknown as { options: { freq: Frequency } }).options.freq;
    }
    return RRule.WEEKLY;
  });
  const [interval, setInterval] = useState<number>(() => {
    if (value) {
      const rule = RRule.fromString(value);
      return (rule as unknown as { options: { interval: number } }).options.interval || 1;
    }
    return 1;
  });
  const [byweekday, setByweekday] = useState<number[]>(() => {
    if (value) {
      const rule = RRule.fromString(value);
      return ((rule as unknown as { options: { byweekday?: { weekday: number }[] } }).options.byweekday || []).map(day => day.weekday);
    }
    return [];
  });
  const [until, setUntil] = useState<Date | null>(() => {
    if (value) {
      const rule = RRule.fromString(value);
      return (rule as unknown as { options: { until?: Date } }).options.until || null;
    }
    return null;
  });
  const [isEnabled, setIsEnabled] = useState(!!value);

  const weekdays = [
    { value: RRule.MO.weekday, label: '月' },
    { value: RRule.TU.weekday, label: '火' },
    { value: RRule.WE.weekday, label: '水' },
    { value: RRule.TH.weekday, label: '木' },
    { value: RRule.FR.weekday, label: '金' },
    { value: RRule.SA.weekday, label: '土' },
    { value: RRule.SU.weekday, label: '日' },
  ];

  const handleFrequencyChange = (newFrequency: Frequency) => {
    setFrequency(newFrequency);
    updateRRule(newFrequency, interval, byweekday, until);
  };

  const handleIntervalChange = (newInterval: number) => {
    setInterval(newInterval);
    updateRRule(frequency, newInterval, byweekday, until);
  };

  const handleWeekdayToggle = (day: number) => {
    const newByweekday = byweekday.includes(day)
      ? byweekday.filter(d => d !== day)
      : [...byweekday, day];
    setByweekday(newByweekday);
    updateRRule(frequency, interval, newByweekday, until);
  };

  const handleUntilChange = (date: string) => {
    const newUntil = date ? new Date(date) : null;
    setUntil(newUntil);
    updateRRule(frequency, interval, byweekday, newUntil);
  };

  const updateRRule = (
    freq: Frequency,
    int: number,
    bwd: number[],
    untilDate: Date | null
  ) => {
    if (!isEnabled) {
      onChange(null);
      return;
    }

    const options: RRuleOptions = {
      freq,
      interval: int,
    };

    if (freq === RRule.WEEKLY && bwd.length > 0) {
      options.byweekday = bwd.map(day => {
        switch (day) {
          case 0: return RRule.MO;
          case 1: return RRule.TU;
          case 2: return RRule.WE;
          case 3: return RRule.TH;
          case 4: return RRule.FR;
          case 5: return RRule.SA;
          case 6: return RRule.SU;
          default: return RRule.MO;
        }
      });
    }

    if (untilDate) {
      options.until = untilDate;
    }

    const rule = new RRule(options);
    onChange(rule.toString());
  };

  const handleEnableChange = (enabled: boolean) => {
    setIsEnabled(enabled);
    if (!enabled) {
      onChange(null);
    } else {
      updateRRule(frequency, interval, byweekday, until);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={isEnabled}
          onChange={(e) => handleEnableChange(e.target.checked)}
          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <span className="ml-2 text-sm text-gray-700">繰り返し設定を有効にする</span>
      </div>

      {isEnabled && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              繰り返しの頻度
            </label>
            <select
              value={frequency}
              onChange={(e) => handleFrequencyChange(parseInt(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value={RRule.DAILY}>毎日</option>
              <option value={RRule.WEEKLY}>毎週</option>
              <option value={RRule.MONTHLY}>毎月</option>
              <option value={RRule.YEARLY}>毎年</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              繰り返しの間隔
            </label>
            <input
              type="number"
              min="1"
              value={interval}
              onChange={(e) => handleIntervalChange(parseInt(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          {frequency === RRule.WEEKLY && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                繰り返す曜日
              </label>
              <div className="flex gap-2">
                {weekdays.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleWeekdayToggle(value)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      byweekday.includes(value)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              終了日
            </label>
            <input
              type="date"
              value={until ? until.toISOString().split('T')[0] : ''}
              onChange={(e) => handleUntilChange(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </>
      )}
    </div>
  );
}; 