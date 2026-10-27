'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip } from '@/components/ui/line-charts-9';
import { TrendingUp, TrendingDown, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CartesianGrid, ComposedChart, Line, ReferenceLine, XAxis, YAxis } from 'recharts';

const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

// Generator data real-time dinamis sesuai kalender saat ini (new Date())
function generateRealtimeChartData(timeframe: string, isSetor: boolean = true) {
  const now = new Date();

  if (timeframe === '1D') {
    // Real time 24 jam hari ini dalam interval 4 jam
    const hours = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '23:59'];
    return hours.map((h, idx) => {
      const base = isSetor ? 1700 : 550;
      const wave = Math.sin((idx + 1) * 0.9) * (isSetor ? 450 : 180);
      return {
        date: h,
        time: h,
        value: Math.max(300, Math.round(base + wave)),
      };
    });
  }

  const numDays = timeframe === '3D' ? 3 : timeframe === '7D' ? 7 : timeframe === '14D' ? 14 : 30;
  const result = [];

  // Wave organik yang mulus untuk visualisasi grafik
  const baseCurveSetor = [1580, 1850, 2150, 2480, 2900, 2550, 2100, 2300, 2600, 2750, 2850, 2600, 2400, 2250];
  const baseCurveTarik = [530, 620, 750, 820, 890, 780, 680, 740, 810, 850, 880, 790, 710, 650];
  const curve = isSetor ? baseCurveSetor : baseCurveTarik;

  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const day = d.getDate();
    const month = MONTHS_ID[d.getMonth()];
    const dateLabel = `${day} ${month}`; // e.g. "22 Okt" s/d "28 Okt"

    const idx = (numDays - 1 - i) % curve.length;
    const baseVal = curve[idx] || (isSetor ? 2300 : 700);
    const variance = Math.round(Math.sin((numDays - i) * 1.1) * (isSetor ? 220 : 70));
    const value = Math.max(isSetor ? 800 : 300, baseVal + variance);

    result.push({
      date: dateLabel,
      time: '12:00',
      value: value,
    });
  }

  return result;
}

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

const CustomTooltip = ({ active, payload, isSetor, isBalanceHidden }: TooltipProps & { isSetor?: boolean; isBalanceHidden?: boolean }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 shadow-xl text-xs">
        <div className="text-zinc-400 mb-1">{data.date}</div>
        <div className="flex items-center gap-2">
          <div className="font-bold text-white font-mono">
            {isBalanceHidden ? 'Rp ***' : `Rp ${(data.value * 1000).toLocaleString('id-ID')}`}
          </div>
          <div className={`text-[11px] font-semibold ${isSetor ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isBalanceHidden ? '***%' : (isSetor ? '+12.7%' : '-4.2%')}
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
  timeframe = '7D',
  onTimeframeChange,
  gmailDisetor,
  hargaGmail,
  isBalanceHidden = false,
  onToggleHideBalance,
}: {
  className?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  timeframe?: string;
  onTimeframeChange?: (period: string) => void;
  gmailDisetor?: number | string;
  hargaGmail?: number | string;
  isBalanceHidden?: boolean;
  onToggleHideBalance?: () => void;
}) {
  const [selectedMetric, setSelectedMetric] = useState<'setor' | 'pengeluaran'>('setor');
  const [internalTimeframe, setInternalTimeframe] = useState<string>('7D');

  const activeTimeframe = timeframe || internalTimeframe;
  const handleTimeframeSelect = (period: string) => {
    setInternalTimeframe(period);
    if (onTimeframeChange) {
      onTimeframeChange(period);
    }
  };

  const isSetor = selectedMetric === 'setor';

  // Dynamic real-time data calculated from current calendar date
  const activeData = React.useMemo(() => {
    return generateRealtimeChartData(activeTimeframe, isSetor);
  }, [activeTimeframe, isSetor]);

  const currentTotal = isSetor ? 24847830 : 6420000;
  const highVal = Math.max(...activeData.map((d) => d.value));
  const lowVal = Math.min(...activeData.map((d) => d.value));

  const refItem = activeData[Math.floor(activeData.length / 2)];
  const refDate = refItem?.date;

  const lineColor = isSetor ? '#c084fc' : '#fb7185';
  const strokeGlow = isSetor ? 'rgba(168, 85, 247, 0.7)' : 'rgba(244, 63, 94, 0.7)';

  return (
    <Card className={`w-full bg-zinc-900/90 border border-zinc-800 shadow-sm ${className}`}>
      <CardContent className="flex flex-col items-stretch gap-5 p-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {isBalanceHidden ? 'Rp ***' : `Rp ${currentTotal.toLocaleString('id-ID')}`}
              </span>
              {onToggleHideBalance && (
                <button
                  type="button"
                  onClick={onToggleHideBalance}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                  title={isBalanceHidden ? 'Tampilkan Angka' : 'Sembunyikan Angka'}
                >
                  {isBalanceHidden ? (
                    <EyeOff className="w-5 h-5 text-zinc-400 hover:text-zinc-200" />
                  ) : (
                    <Eye className="w-5 h-5 text-zinc-400 hover:text-zinc-200" />
                  )}
                </button>
              )}
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
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            )}

            {/* Timeframe Selector with 1D, 3D, 7D, 14D, 30D (with locked borders to avoid layout shift) */}
            <div className="flex items-center gap-1 bg-zinc-950/80 p-0.5 rounded-lg border border-zinc-800">
              {['1D', '3D', '7D', '14D', '30D'].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleTimeframeSelect(d)}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer border ${activeTimeframe === d
                      ? 'bg-zinc-800 text-purple-400 font-semibold border-zinc-700/80 shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border-transparent'
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
                  {isBalanceHidden
                    ? '*** Akun'
                    : gmailDisetor !== undefined
                    ? typeof gmailDisetor === 'number'
                      ? `${gmailDisetor.toLocaleString('id-ID')} Akun`
                      : gmailDisetor
                    : '2 Akun'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-400">Harga Gmail :</span>
                <span className="font-semibold text-emerald-400 font-mono">
                  {isBalanceHidden
                    ? 'Rp ***'
                    : hargaGmail !== undefined
                      ? typeof hargaGmail === 'number'
                        ? `Rp ${hargaGmail.toLocaleString('id-ID')}`
                        : hargaGmail
                      : 'Rp 4.500'}
                </span>
              </div>
            </div>
          </div>

          {/* Chart */}
          <ChartContainer
            config={chartConfig}
            className="h-72 sm:h-80 w-full min-w-0 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-initial"
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
              {refDate && (
                <ReferenceLine x={refDate} stroke={lineColor} strokeDasharray="4 4" strokeWidth={1} />
              )}

              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                height={30}
                tick={{ fontSize: 11, fill: '#a1a1aa' }}
                tickMargin={8}
                interval="preserveStartEnd"
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                width={48}
                tick={{ fontSize: 11, fill: '#a1a1aa' }}
                tickFormatter={(value) => (isBalanceHidden ? '***' : `${(value / 1000).toFixed(1)}k`)}
                tickMargin={8}
              />

              <ChartTooltip
                content={<CustomTooltip isSetor={isSetor} isBalanceHidden={isBalanceHidden} />}
                cursor={{ strokeDasharray: '3 3', stroke: '#71717a', strokeOpacity: 0.5 }}
              />

              <Line
                key={activeTimeframe}
                type="monotone"
                dataKey="value"
                stroke={lineColor}
                strokeWidth={2.5}
                filter="url(#lineShadow)"
                isAnimationActive={true}
                animationDuration={600}
                animationEasing="ease-in-out"
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  if (
                    payload.date === refDate ||
                    payload.value === highVal ||
                    payload.value === lowVal
                  ) {
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
