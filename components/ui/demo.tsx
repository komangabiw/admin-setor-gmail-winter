'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip } from '@/components/ui/line-charts-9';
import { TrendingUp } from 'lucide-react';
import { CartesianGrid, ComposedChart, Line, ReferenceLine, XAxis, YAxis } from 'recharts';

// E-commerce revenue tracking with seasonal fluctuations
const portfolioData = [
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

// Chart configuration
const chartConfig = {
  value: {
    label: 'Balance',
    color: 'var(--color-purple-500, #a855f7)',
  },
} satisfies ChartConfig;

// Calculate portfolio metrics
const currentBalance = 24847.83;
const todaysPnL = 1249.0;
const pnlPercentage = 8;
const highValue = Math.max(...portfolioData.map((d) => d.value));
const lowValue = Math.min(...portfolioData.map((d) => d.value));
const change = -0.082;

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

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
        <div className="text-sm text-muted-foreground mb-1">{data.date}</div>
        <div className="flex items-center gap-2">
          <div className="text-base font-bold">${(data.value * 10).toLocaleString()}.00</div>
          <div className="text-[11px] text-emerald-600">+12.7%</div>
        </div>
      </div>
    );
  }
  return null;
};

export function LineChart9({ className = '' }: { className?: string }) {
  return (
    <Card className={`w-full bg-zinc-900/90 border border-zinc-800 shadow-sm ${className}`}>
      <CardContent className="flex flex-col items-stretch gap-5 p-5">
        {/* Header */}
        <div className="mb-2">
          <h2 className="text-xs text-zinc-400 font-medium mb-1 uppercase tracking-wider">Tren Perputaran Saldo & Transaksi</h2>
          <div className="flex flex-wrap items-baseline gap-2 sm:gap-3.5">
            <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Rp {Math.round(currentBalance * 1000).toLocaleString('id-ID')}
            </span>
            <div className="flex items-center gap-1 text-emerald-400 text-xs">
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="font-semibold">+12.7%</span>
              <span className="text-zinc-500 font-normal">24 jam terakhir</span>
            </div>
          </div>
        </div>

        <div className="grow">
          {/* Stats Row */}
          <div className="flex items-center justify-between flex-wrap gap-2.5 text-xs mb-3 border-y border-zinc-800/80 py-2">
            {/* Today's Sales */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-400">Setoran Hari Ini:</span>
                <span className="font-semibold text-zinc-100">
                  Rp {Math.round(todaysPnL * 1000).toLocaleString('id-ID')}
                </span>
                <div className="flex items-center gap-0.5 text-emerald-400 font-medium">
                  <TrendingUp className="w-3 h-3" />
                  <span>(+{pnlPercentage}%)</span>
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-4 text-zinc-400 text-[11px]">
              <span>
                Tertinggi: <span className="text-sky-400 font-medium">Rp {Math.round(highValue * 1000).toLocaleString('id-ID')}</span>
              </span>
              <span>
                Terendah: <span className="text-amber-400 font-medium">Rp {Math.round(lowValue * 1000).toLocaleString('id-ID')}</span>
              </span>
              <span>
                Perubahan: <span className="text-emerald-400 font-medium">{change}%</span>
              </span>
            </div>
          </div>

          {/* Chart */}
          <ChartContainer
            config={chartConfig}
            className="h-72 sm:h-80 w-full [&_.recharts-curve.recharts-tooltip-cursor]:stroke-initial"
          >
            <ComposedChart
              data={portfolioData}
              margin={{
                top: 20,
                right: 15,
                left: 10,
                bottom: 10,
              }}
            >
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
                <pattern id="dotGrid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="10" cy="10" r="1" fill="#3f3f46" fillOpacity="0.4" />
                </pattern>
                <filter id="dotShadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="2" dy="3" stdDeviation="3" floodColor="rgba(0,0,0,0.8)" />
                </filter>
                <filter id="lineShadow" x="-100%" y="-100%" width="300%" height="300%">
                  <feDropShadow dx="2" dy="4" stdDeviation="15" floodColor="rgba(168, 85, 247, 0.7)" />
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
              <ReferenceLine x="Jan 17" stroke="#a855f7" strokeDasharray="4 4" strokeWidth={1} />

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
                content={<CustomTooltip />}
                cursor={{ strokeDasharray: '3 3', stroke: '#71717a', strokeOpacity: 0.5 }}
              />

              <Line
                type="monotone"
                dataKey="value"
                stroke="#c084fc"
                strokeWidth={2.5}
                filter="url(#lineShadow)"
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  if (payload.date === 'Jan 17' || payload.value > 2800 || payload.value < 1000) {
                    return (
                      <circle
                        key={`dot-${payload.date}`}
                        cx={cx}
                        cy={cy}
                        r={5}
                        fill="#c084fc"
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
                  fill: '#c084fc',
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
