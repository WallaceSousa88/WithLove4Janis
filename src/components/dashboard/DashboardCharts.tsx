import React from 'react';
import { Users, BarChart as BarChartIcon, PieChart as PieChartIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Sector, Legend
} from 'recharts';
import { Pessoa, PALETTES } from '../../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 4}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <text 
        x={cx} 
        y={cy} 
        textAnchor="middle" 
        dominantBaseline="central"
      >
        <tspan x={cx} dy="-1.2em" fontSize={12} fill="#6b7280" fontWeight="500">{payload.name}</tspan>
        <tspan x={cx} dy="1.2em" fontSize={18} fill="#111827" fontWeight="700">{formatCurrency(value)}</tspan>
        <tspan x={cx} dy="1.2em" fontSize={12} fill="#6b7280" fontWeight="500">{(percent * 100).toFixed(0)}%</tspan>
      </text>
    </g>
  );
};

interface DashboardChartsProps {
  hasRecords: boolean;
  pessoas: Pessoa[];
  chartPersonFilter: number;
  setChartPersonFilter: (val: number) => void;
  barChartData: any[];
  pieChartData: any[];
}

export function DashboardCharts({
  hasRecords,
  pessoas,
  chartPersonFilter,
  setChartPersonFilter,
  barChartData,
  pieChartData
}: DashboardChartsProps) {
  const [activeChart, setActiveChart] = React.useState<'bar' | 'pie'>('bar');
  const [activePieIndex, setActivePieIndex] = React.useState(0);

  if (!hasRecords) return null;

  return (
    <div className="flex-[2] flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-gray-400" />
          <select
            value={chartPersonFilter}
            onChange={(e) => setChartPersonFilter(parseInt(e.target.value))}
            className="rounded-xl border-soft bg-white px-3 py-1.5 text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 shadow-soft"
          >
            <option value={-1}>Todas as Pessoas</option>
            {pessoas.map(p => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1 bg-white p-1 rounded-xl shadow-soft border-soft">
          <button
            onClick={() => setActiveChart('bar')}
            className={cn(
              "p-2 rounded-lg transition-all",
              activeChart === 'bar' ? "bg-indigo-600 text-white shadow-md" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
            )}
            title="Gráfico de Barras"
          >
            <BarChartIcon size={18} />
          </button>
          <button
            onClick={() => setActiveChart('pie')}
            className={cn(
              "p-2 rounded-lg transition-all",
              activeChart === 'pie' ? "bg-indigo-600 text-white shadow-md" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
            )}
            title="Gráfico de Pizza"
          >
            <PieChartIcon size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 relative">
        <AnimatePresence mode="wait">
          {activeChart === 'bar' ? (
            <motion.div
              key="bar"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 rounded-2xl bg-white p-4 shadow-soft border-soft flex flex-col"
            >
              <div className="flex-1 w-full min-h-0">
                {barChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData} margin={{ top: 10, right: 130, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={(val) => formatCurrency(val).replace('R$', '').trim()} tick={{ fontSize: 11 }} />
                      <Tooltip 
                        formatter={(value: number) => [formatCurrency(value), 'Valor']}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        cursor={{ fill: '#f3f4f6' }}
                      />
                      <Legend 
                        verticalAlign="middle" 
                        align="right" 
                        layout="vertical" 
                        wrapperStyle={{ 
                          fontSize: '15px', 
                          fontWeight: '600', 
                          paddingLeft: '20px',
                          width: '140px'
                        }} 
                      />
                      {pessoas.map(p => (
                        <Bar key={p.id} dataKey={p.nome} stackId="a" fill={p.cor} radius={[0, 0, 0, 0]} />
                      ))}
                      <Bar dataKey="Dividir" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400 font-medium">
                    Nenhum dado para este filtro
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="pie"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 rounded-2xl bg-white p-0 shadow-soft border-soft flex flex-col"
            >
              <div className="flex-1 w-full min-h-0">
                {pieChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                      <Pie
                        activeIndex={activePieIndex}
                        activeShape={renderActiveShape}
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius="65%"
                        outerRadius="95%"
                        fill="#8884d8"
                        dataKey="value"
                        onMouseEnter={(_, index) => setActivePieIndex(index)}
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PALETTES[0].colors[index % PALETTES[0].colors.length]} stroke="#fff" strokeWidth={2} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400 font-medium">
                    Nenhum dado para este filtro
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
