import { useTheme } from '../../contexts/ThemeContext';
import { hexToRgb, getGlassCardStyle } from '../../utils/glassStyles';
import { CheckSquare, TrendingUp } from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';

interface DonutEntry {
  name: string;
  value: number;
  color: string;
}

interface BarEntry {
  label: string;
  value: number;
}

interface Props {
  donutData: DonutEntry[];
  barData: BarEntry[];
}

export function DashboardCharts({ donutData, barData }: Props) {
  const { theme } = useTheme();
  const primaryRgb = hexToRgb(theme.primary);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', margin: '0 1.5rem 1.5rem' }}>

      {/* Donut — tasks by status */}
      <div style={{ ...getGlassCardStyle(theme), padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <CheckSquare size={16} style={{ color: theme.primary }} />
          <span style={{ color: theme.text, fontWeight: 600, fontSize: '0.9375rem' }}>Задачи по статусам</span>
        </div>
        {donutData.length === 0 ? (
          <div style={{ textAlign: 'center', color: theme.textSecondary, padding: '2rem 0', fontSize: '0.875rem' }}>Нет данных</div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie data={donutData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3}>
                  {donutData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: theme.surface, border: `1px solid rgba(${primaryRgb}, 0.2)`, borderRadius: '0.75rem', color: theme.text, fontSize: '0.8125rem' }}
                  itemStyle={{ color: theme.text }}
                  labelStyle={{ color: theme.text }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
              {donutData.map((entry, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: entry.color, flexShrink: 0 }} />
                  <span style={{ color: theme.textSecondary, fontSize: '0.8125rem', flex: 1 }}>{entry.name}</span>
                  <span style={{ color: theme.text, fontSize: '0.875rem', fontWeight: 600 }}>{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bar — completed last 7 days */}
      <div style={{ ...getGlassCardStyle(theme), padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <TrendingUp size={16} style={{ color: theme.primary }} />
          <span style={{ color: theme.text, fontWeight: 600, fontSize: '0.9375rem' }}>Выполнено за 7 дней</span>
        </div>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={barData} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={`rgba(${primaryRgb}, 0.1)`} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: theme.textSecondary, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: theme.textSecondary, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: theme.surface, border: `1px solid rgba(${primaryRgb}, 0.2)`, borderRadius: '0.75rem', color: theme.text, fontSize: '0.8125rem' }}
              itemStyle={{ color: theme.text }}
              labelStyle={{ color: theme.text }}
              cursor={{ fill: `rgba(${primaryRgb}, 0.08)` }}
            />
            <Bar dataKey="value" name="Выполнено" fill={theme.primary} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
