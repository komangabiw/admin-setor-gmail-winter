'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip } from '@/components/ui/line-charts-9';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CartesianGrid, ComposedChart, Line, ReferenceLine, XAxis, YAxis } from 'recharts';

// Data setoran
const setorData = [
  { date: 'Jan 1', value: 850, time: '20:00' },
  { date: 'Jan 2', value: 1100, time: '00:00' },
  { date: 'Jan 3', value: 1680, time: '04:00' },
  { date: 'Jan 4', value: 1490, time: '08:00' },
  { date: 'Jan 5', value: 2020, time: '12:00' },
  { date: 'Jan 6', value: 2080, time: '16:00' },
  { date: 'Jan 7', value: 2180, time: '20:00' },
  { date: 'Jan 8', value: 2250, time: '00:00' },
  { date: 'Jan 9', value: 2480, time: '04:00' },
  { date: 'Jan 10', value: 2290, time: '08:00' },
  { date: 'Jan 11', value: 2450, time: '12:00' },
  { date: 'Jan 12', value: 2380, time: '16:00' },
  { date: 'Jan 13', value: 2220, time: '20:00' },
  { date: 'Jan 14', value: 1980, time: '00:00' },
  { date: 'Jan 15', value: 1750, time: '04:00' },
  { date: 'Jan 16', value: 1620, time: '08:00' },
  { date: 'Jan 17', value: 1480, time: '12:00' },
  { date: 'Jan 18', value: 1580, time: '16:00' },
  { date: 'Jan 19', value: 1820, time: '20:00' },
  { date: 'Jan 20', value: 1950, time: '00:00' },
  { date: 'Jan 21', value: 2080, time: '04:00' },
  { date: 'Jan 22', value: 2220, time: '08:00' },
  { date: 'Jan 23', value: 2380, time: '12:00' },
  { date: 'Jan 24', value: 2550, time: '16:00' },
  { date: 'Jan 25', value: 2480, time: '20:00' },
  { date: 'Jan 26', value: 2720, time: '00:00' },
  { date: 'Jan 27', value: 2900, time: '04:00' },
  { date: 'Jan 28', value: 2550, time: '08:00' },
  { date: 'Jan 29', value: 2320, time: '12:00' },
  { date: 'Feb 15', value: 2250, time: '14:00' },
  { date: 'Mar 24', value: 1900, time: '16:00' },
];

// Data pengeluaran (withdrawals / payout)
const pengeluaranData = [
  { date: 'Jan 1', value: 350, time: '20:00' },
  { date: 'Jan 2', value: 420, time: '00:00' },
  { date: 'Jan 3', value: 580, time: '04:00' },
  { date: 'Jan 4', value: 490, time: '08:00' },
  { date: 'Jan 5', value: 650, time: '12:00' },
  { date: 'Jan 6', value: 720, time: '16:00' },
  { date: 'Jan 7', value: 680, time: '20:00' },
  { date: 'Jan 8', value: 790, time: '00:00' },
  { date: 'Jan 9', value: 850, time: '04:00' },
  { date: 'Jan 10', value: 760, time: '08:00' },
  { date: 'Jan 11', value: 820, time: '12:00' },
  { date: 'Jan 12', value: 790, time: '16:00' },
  { date: 'Jan 13', value: 710, time: '20:00' },
  { date: 'Jan 14', value: 640, time: '00:00' },
  { date: 'Jan 15', value: 580, time: '04:00' },
  { date: 'Jan 16', value: 520, time: '08:00' },
  { date: 'Jan 17', value: 480, time: '12:00' },
  { date: 'Jan 18', value: 530, time: '16:00' },
  { date: 'Jan 19', value: 610, time: '20:00' },
  { date: 'Jan 20', value: 680, time: '00:00' },
  { date: 'Jan 21', value: 720, time: '04:00' },
  { date: 'Jan 22', value: 780, time: '08:00' },
  { date: 'Jan 23', value: 810, time: '12:00' },
  { date: 'Jan 24', value: 850, time: '16:00' },
  { date: 'Jan 25', value: 790, time: '20:00' },
  { date: 'Jan 26', value: 830, time: '00:00' },
  { date: 'Jan 27', value: 890, time: '04:00' },
  { date: 'Jan 28', value: 780, time: '08:00' },
  { date: 'Jan 29', value: 690, time: '12:00' },
  { date: 'Feb 15', value: 640, time: '14:00' },
  { date: 'Mar 24', value: 590, time: '16:00' },
];

const chartConfig = {
  value: {
    label: 'Nominal',
    color: '#a855f7',
  },
} satisfies ChartConfig;

// Custom Tooltip
interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      date: string;
      value: number;
    };
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, isSetor }: TooltipProps & { isSetor?: boolean }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 shadow-xl text-xs">
        <div className="text-zinc-400 mb-1">{data.date}</div>
        <div className="flex items-center gap-2">
          <div className="font-bold text-white">
            Rp {(data.value * 1000).toLocaleString('id-ID')}
          </div>
          <div className={`text-[11px] font-semibold ${isSetor ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isSetor ? '+12.7%' : '-4.2%'}
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function LineChart9({
  className = '',
  onRefresh,
  isRefreshing,
  timeframe = '30D',
  onTimeframeChange,
  gmailDisetor,
  hargaGmail,
}: {
  className?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  timeframe?: string;
  onTimeframeChange?: (period: string) => void;
  gmailDisetor?: number | string;
  hargaGmail?: number | string;
}) {
  const [selectedMetric, setSelectedMetric] = useState<'setor' | 'pengeluaran'>('setor');
  const [internalTimeframe, setInternalTimeframe] = useState<string>('30D');

  const activeTimeframe = timeframe || internalTimeframe;
  const handleTimeframeSelect = (period: string) => {
    setInternalTimeframe(period);
    if (onTimeframeChange) {
      onTimeframeChange(period);
    }
  };

  const isSetor = selectedMetric === 'setor';
  const baseData = isSetor ? setorData : pengeluaranData;

  // Filter data based on active timeframe
  const activeData = React.useMemo(() => {
    if (activeTimeframe === '1D') return baseData.slice(-3);
    if (activeTimeframe === '3D') return baseData.slice(-6);
    if (activeTimeframe === '7D') return baseData.slice(-12);
    if (activeTimeframe === '14D') return baseData.slice(-20);
    return baseData;
  }, [baseData, activeTimeframe]);

  const currentTotal = isSetor ? 24847830 : 6420000;
  const todayAmount = isSetor ? 1249000 : 350000;
  const highVal = Math.max(...activeData.map((d) => d.value));
  const lowVal = Math.min(...activeData.map((d) => d.value));

  const lineColor = isSetor ? '#c084fc' : '#fb7185';
  const strokeGlow = isSetor ? 'rgba(168, 85, 247, 0.7)' : 'rgba(244, 63, 94, 0.7)';

  return (
    <Card className={`w-full bg-zinc-900/90 border border-zinc-800 shadow-sm ${className}`}>
      <CardContent className="flex flex-col items-stretch gap-5 p-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-baseline gap-2 sm:gap-3.5">
              <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Rp {currentTotal.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Right side: Enlarged Refresh Button with Day Selector underneath */}
          <div className="flex flex-col sm:items-end gap-2 shrink-0">
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="h-9 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600 text-zinc-100 transition-all cursor-pointer shadow-sm disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
            )}

            {/* Timeframe Selector with 1D, 3D, 7D, 14D, 30D */}
            <div className="flex items-center gap-1 bg-zinc-950/80 p-0.5 rounded-lg border border-zinc-800">
              {['1D', '3D', '7D', '14D', '30D'].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleTimeframeSelect(d)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer ${
                    activeTimeframe === d
                      ? "bg-zinc-800 text-purple-400 font-semibold border border-zinc-700/80 shadow-xs"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grow">
          {/* Stats Row */}
          <div className="flex items-center justify-between flex-wrap gap-4 text-xs mb-3 border-y border-zinc-800/80 py-2.5">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-400">Gmail Disetor :</span>
                <span className="font-semibold text-white font-mono">
                  {gmailDisetor !== undefined
                    ? (typeof gmailDisetor === 'number' ? `${gmailDisetor.toLocaleString('id-ID')} Akun` : gmailDisetor)
                    : '2 Akun'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-400">Harga Gmail :</span>
                <span className="font-semibold text-emerald-400 font-mono">
                  {hargaGmail !== undefined
                    ? (typeof hargaGmail === 'number' ? `Rp ${hargaGmail.toLocaleString('id-ID')}` : hargaGmail)
                    : 'Rp 4.500'}
                </span>
              </div>
            </div>
          </div>

          {/* Chart */}
          <ChartContainer
            config={chartConfig}
            className="h-72 sm:h-80 w-full [&_.recharts-curve.recharts-tooltip-cursor]:stroke-initial"
          >
            <ComposedChart
              data={activeData}
              margin={{
                top: 20,
                right: 15,
                left: 10,
                bottom: 10,
              }}
            >
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={lineColor} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
                </linearGradient>
                <pattern id="dotGrid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="10" cy="10" r="1" fill="#3f3f46" fillOpacity="0.4" />
                </pattern>
                <filter id="dotShadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="2" dy="3" stdDeviation="3" floodColor="rgba(0,0,0,0.8)" />
                </filter>
                <filter id="lineShadow" x="-100%" y="-100%" width="300%" height="300%">
                  <feDropShadow dx="2" dy="4" stdDeviation="15" floodColor={strokeGlow} />
                </filter>
              </defs>

              <rect x="0" y="0" width="100%" height="100%" fill="url(#dotGrid)" style={{ pointerEvents: 'none' }} />

              <CartesianGrid
                strokeDasharray="4 8"
                stroke="#27272a"
                strokeOpacity={0.8}
                horizontal={true}
                vertical={false}
              />

              {/* Active tick reference line */}
              <ReferenceLine x="Jan 17" stroke={lineColor} strokeDasharray="4 4" strokeWidth={1} />

              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#a1a1aa' }}
                tickMargin={12}
                interval="preserveStartEnd"
                tickCount={6}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#a1a1aa' }}
                tickFormatter={(value) => `${(value / 1000).toFixed(1)}k`}
                tickMargin={12}
              />

              <ChartTooltip
                content={<CustomTooltip isSetor={isSetor} />}
                cursor={{ strokeDasharray: '3 3', stroke: '#71717a', strokeOpacity: 0.5 }}
              />

              <Line
                type="monotone"
                dataKey="value"
                stroke={lineColor}
                strokeWidth={2.5}
                filter="url(#lineShadow)"
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  if (payload.date === 'Jan 17' || payload.value > (isSetor ? 2800 : 850) || payload.value < (isSetor ? 1000 : 400)) {
                    return (
                      <circle
                        key={`dot-${payload.date}`}
                        cx={cx}
                        cy={cy}
                        r={5}
                        fill={lineColor}
                        stroke="#ffffff"
                        strokeWidth={2}
                        filter="url(#dotShadow)"
                      />
                    );
                  }

                  return <g key={`dot-${payload.date}`} />;
                }}
                activeDot={{
                  r: 6,
                  fill: lineColor,
                  stroke: '#ffffff',
                  strokeWidth: 2,
                  filter: 'url(#dotShadow)',
                }}
              />
            </ComposedChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export default LineChart9;
