import React, { useState, useMemo } from 'react';
import {
  FunnelChart, Funnel, LabelList, Tooltip, ResponsiveContainer,
  AreaChart, Area, Cell
} from 'recharts';
import { Users, Car, Target, ShoppingBag, ArrowUpRight, MessageCircle, Calendar, Tag, DollarSign, Layers } from 'lucide-react';
import { Lead, LeadPhase, Vehicle } from '../types';

interface DashboardProps {
  leads: Lead[];
  vehicles: Vehicle[];
}

type TimeFilter = 'all' | 'today' | 'yesterday' | 'last-7-days' | 'this-month' | 'last-month' | 'custom';

const Dashboard: React.FC<DashboardProps> = ({ leads, vehicles }) => {
  const [filter, setFilter] = useState<TimeFilter>('this-month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Helper simples para filtrar datas
  const filterByDate = (dateStr: string) => {
    if (filter === 'all') return true;

    const date = new Date(dateStr);
    const now = new Date();
    // Reset hours for accurate day comparison
    date.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (filter === 'today') {
      return date.getTime() === today.getTime();
    }

    if (filter === 'yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return date.getTime() === yesterday.getTime();
    }

    if (filter === 'last-7-days') {
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return date >= sevenDaysAgo && date <= today;
    }

    if (filter === 'this-month') {
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }

    if (filter === 'last-month') {
      const lastMonth = new Date(now);
      lastMonth.setMonth(now.getMonth() - 1);
      // Handle year rollover (january -> december previous year) automatically by setMonth
      return date.getMonth() === lastMonth.getMonth() &&
        date.getFullYear() === lastMonth.getFullYear();
    }

    if (filter === 'custom') {
      if (!customStart || !customEnd) return true;
      // Fix timezone issues by treating input string as local YYYY-MM-DD
      // Create date from "YYYY-MM-DD" + "T00:00:00" mapping
      const start = new Date(customStart + 'T00:00:00');
      const end = new Date(customEnd + 'T23:59:59');
      // Adjust date to compare correctly
      return date >= start && date <= end;
    }

    return true;
  };

  // Metrics Logic
  const filteredLeads = leads.filter(l => filterByDate(l.createdAt));
  const soldVehicles = vehicles.filter(v => v.status === 'sold' && (v.saleDetails ? filterByDate(v.saleDetails.saleDate) : true));

  // New Metrics Calculation
  const leadsRecebidos = filteredLeads.length;
  // User requested "Qualificados" mapped to "Desqualificado" logic. Using "Desqualificados" for clarity.
  const leadsDesqualificados = filteredLeads.filter(l => l.phase === LeadPhase.DISQUALIFIED).length;
  // Leads Qualificados: New logic (Simulation OR Visit OR Follow-up) and NOT Disqualified
  const leadsQualificados = filteredLeads.filter(l =>
    l.phase !== LeadPhase.DISQUALIFIED &&
    (l.funnelHistory?.[LeadPhase.SIMULATION] || l.funnelHistory?.[LeadPhase.VISIT] || l.funnelHistory?.[LeadPhase.FOLLOW_UP])
  ).length;
  const vendasFeitas = soldVehicles.length;

  const stats = [
    {
      label: 'Leads Recebidos',
      value: leadsRecebidos,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      desc: 'Total de novos contatos'
    },
    {
      label: 'Leads Desqualificados',
      value: leadsDesqualificados,
      icon: Target,
      color: 'text-red-600',
      bg: 'bg-red-50',
      desc: 'Leads descartados'
    },
    {
      label: 'Leads Qualificados',
      value: leadsQualificados,
      icon: MessageCircle,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      desc: 'Em negociação ativa'
    },
    {
      label: 'Vendas Feitas',
      value: vendasFeitas,
      icon: ShoppingBag,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      desc: 'Negócios fechados'
    }
  ];

  // Stock Metrics Calculation
  const availableVehicles = useMemo(() => vehicles.filter(v => v.status === 'available'), [vehicles]);
  const totalStockValue = useMemo(() => availableVehicles.reduce((acc, v) => acc + (v.price || 0), 0), [availableVehicles]);
  const avgTicket = availableVehicles.length > 0 ? totalStockValue / availableVehicles.length : 0;

  const topCategory = useMemo(() => {
    if (availableVehicles.length === 0) return 'N/A';
    const counts: Record<string, number> = {};
    availableVehicles.forEach(v => { counts[v.type] = (counts[v.type] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  }, [availableVehicles]);

  const stockStats = [
    {
      label: 'Veículos em Estoque',
      value: availableVehicles.length,
      icon: Car,
      color: 'text-slate-600',
      bg: 'bg-slate-50',
      desc: 'Disponíveis para venda',
      isCurrency: false
    },
    {
      label: 'Valor em Estoque',
      value: totalStockValue,
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      desc: 'Patrimônio acumulado',
      isCurrency: true
    },
    {
      label: 'Ticket Médio',
      value: avgTicket,
      icon: Tag,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      desc: 'Média de preço',
      isCurrency: true
    },
    {
      label: 'Categoria Principal',
      value: topCategory,
      icon: Layers,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      desc: 'Maior volume',
      isCurrency: false
    }
  ];

  // Growth Chart Logic
  const growthData = useMemo(() => {
    const dataPoints: { name: string; v: number }[] = [];
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();
    let interval: 'day' | 'month' = 'day';

    // Determine Range and Interval
    if (filter === 'all') {
      interval = 'month';
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
    } else if (filter === 'this-month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (filter === 'last-month') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0); // Last day of previous month
    } else if (filter === 'last-7-days') {
      startDate = new Date();
      startDate.setDate(now.getDate() - 6); // 7 days including today
    } else if (filter === 'yesterday') {
      startDate = new Date();
      startDate.setDate(now.getDate() - 1);
      endDate = new Date();
      endDate.setDate(now.getDate() - 1);
    } else if (filter === 'custom' && customStart && customEnd) {
      startDate = new Date(customStart + 'T00:00:00');
      endDate = new Date(customEnd + 'T23:59:59');
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 62) interval = 'month'; // If range is more than ~2 months, group by month
    }

    // Generate Points Loop
    const cleanDate = (d: Date) => {
      const c = new Date(d);
      c.setHours(0, 0, 0, 0);
      return c;
    }

    let current = cleanDate(startDate);
    const end = cleanDate(endDate);
    // Ensure end includes today if applicable for filters like 'this-month', 'last-7-days', 'all'
    if (filter !== 'last-month' && filter !== 'yesterday' && filter !== 'custom') {
      end.setTime(cleanDate(now).getTime());
    }

    while (current <= end) {
      let count = 0;
      let label = '';

      if (interval === 'day') {
        count = filteredLeads.filter(l => {
          const d = new Date(l.createdAt);
          return d.getDate() === current.getDate() &&
            d.getMonth() === current.getMonth() &&
            d.getFullYear() === current.getFullYear();
        }).length;
        label = `${current.getDate()}`; // short label for day
        current.setDate(current.getDate() + 1);
      } else { // interval === 'month'
        count = filteredLeads.filter(l => {
          const d = new Date(l.createdAt);
          return d.getMonth() === current.getMonth() &&
            d.getFullYear() === current.getFullYear();
        }).length;
        label = `${current.getMonth() + 1}/${current.getFullYear().toString().substr(2)}`;
        current.setMonth(current.getMonth() + 1);
      }

      dataPoints.push({ name: label, v: count });

      // Safety break for infinite loops (e.g., if dates are miscalculated)
      if (dataPoints.length > 366) break; // Max 366 days or 12 months
    }

    return dataPoints;
  }, [filteredLeads, filter, customStart, customEnd]);




  // Calculate Growth % (This filter period vs Previous filter period)
  const growthPercentage = useMemo(() => {
    // If 'all', compare last 30 days vs previous 30 days
    // If 'this-month', compare with 'last-month' logic
    const now = new Date();
    let currentCount = 0;
    let prevCount = 0;

    if (filter === 'all' || filter === 'this-month') {
      // Compare this month vs last month
      currentCount = leads.filter(l => {
        const d = new Date(l.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).length;

      prevCount = leads.filter(l => {
        const d = new Date(l.createdAt);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
      }).length;
    } else {
      // Last month vs 2 months ago
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const twoMonthsAgoDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);

      currentCount = leads.filter(l => {
        const d = new Date(l.createdAt);
        return d.getMonth() === lastMonthDate.getMonth() && d.getFullYear() === lastMonthDate.getFullYear();
      }).length;

      prevCount = leads.filter(l => {
        const d = new Date(l.createdAt);
        return d.getMonth() === twoMonthsAgoDate.getMonth() && d.getFullYear() === twoMonthsAgoDate.getFullYear();
      }).length;
    }

    if (prevCount === 0) return currentCount > 0 ? 100 : 0;
    return Math.round(((currentCount - prevCount) / prevCount) * 100);
  }, [leads, filter]);

  // Simplificação do Funil conforme solicitação
  const phaseData = useMemo(() => {
    return [
      {
        name: 'Novos Leads',
        fullName: LeadPhase.NEW,
        value: leads.length // Todo mundo entra como novo
      },
      {
        name: 'Leads Qualificados',
        fullName: LeadPhase.FOLLOW_UP,
        value: leads.filter(l =>
          l.phase !== LeadPhase.DISQUALIFIED &&
          (l.funnelHistory?.[LeadPhase.FOLLOW_UP] || l.funnelHistory?.[LeadPhase.SIMULATION] || l.funnelHistory?.[LeadPhase.VISIT])
        ).length
      },
      {
        name: 'Vendas Feitas',
        fullName: LeadPhase.COMPLETED,
        value: leads.filter(l => l.funnelHistory?.[LeadPhase.COMPLETED] || l.phase === LeadPhase.COMPLETED).length
      },
      {
        name: 'Leads Desqualificados',
        fullName: LeadPhase.DISQUALIFIED,
        value: leads.filter(l => l.phase === LeadPhase.DISQUALIFIED || l.funnelHistory?.[LeadPhase.DISQUALIFIED]).length
      }
    ];
  }, [leads]);

  const colors = ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#3B82F6', '#60A5FA', '#93C5FD', '#F87171'];

  return (
    <div className="space-y-8 animate-fadeUp" >
      {/* Header with Filter */}
      < div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" >
        <div>
          <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Visão Geral</h3>
          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">Acompanhamento de performance</p>
        </div>

        <div className="flex items-center gap-2">
          {filter === 'custom' && (
            <div className="flex items-center gap-2 animate-fadeRight">
              <input
                type="date"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                className="bg-white border border-slate-100 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <span className="text-slate-400 font-bold text-xs">até</span>
              <input
                type="date"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                className="bg-white border border-slate-100 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          )}

          <div className="flex items-center gap-2 bg-white border border-slate-100 rounded-xl p-1.5 shadow-sm">
            <Calendar size={16} className="text-slate-400 ml-2" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as TimeFilter)}
              className="bg-transparent text-xs font-bold text-slate-600 outline-none cursor-pointer py-1.5 pr-2"
            >
              <option value="today">Hoje</option>
              <option value="yesterday">Ontem</option>
              <option value="last-7-days">Últimos 7 dias</option>
              <option value="this-month">Este Mês</option>
              <option value="last-month">Mês Passado</option>
              <option value="all">Todo o Período</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>
        </div>
      </div >

      {/* Metrics Grid */}
      < div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" >
        {
          stats.map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 group">
              <div className="flex justify-between items-start mb-6">
                <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                  <stat.icon size={22} strokeWidth={2.5} />
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowUpRight size={12} /> +2%
                </div>
              </div>
              <div>
                <p className="text-4xl font-black text-slate-900 tracking-tighter mb-1">{stat.value}</p>
                <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-[10px] font-medium text-slate-300">{stat.desc}</p>
              </div>
            </div>
          ))
        }
      </div >

      {/* Inventory Section */}
      <div>
        <h3 className="text-xl font-extrabold text-slate-900 tracking-tight mb-4">Visão de Estoque</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stockStats.map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 group">
              <div className="flex justify-between items-start mb-6">
                <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                  <stat.icon size={22} strokeWidth={2.5} />
                </div>
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900 tracking-tighter mb-1 break-words">
                  {stat.isCurrency ? (stat.value as number).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : stat.value}
                </p>
                <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-[10px] font-medium text-slate-300">{stat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Charts Section */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Performance do Funil</h3>
            <button onClick={() => alert("Relatórios detalhados em breve")} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-emerald-500 transition-colors">Ver Relatório</button>
          </div>
          <div className="h-[300px] w-full flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Tooltip
                  cursor={{ fill: '#F8FAFC' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Funnel
                  dataKey="value"
                  data={phaseData}
                  isAnimationActive
                >
                  <LabelList position="right" fill="#64748b" stroke="none" dataKey="name" content={({ x, y, value, name, width, height }) => (
                    <text x={Number(x) + Number(width) + 10} y={Number(y) + Number(height) / 2 + 5} fill="#64748b" textAnchor="start" fontSize={11} fontWeight={700}>
                      {name}: {value}
                    </text>
                  )} />
                  {
                    phaseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fullName === 'Desqualificado' ? '#fee2e2' : colors[index % colors.length]} />
                    ))
                  }
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col">
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight mb-8">Entrada de Leads</h3>
          <div className="flex-1 min-h-[150px] mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData}>
                <defs>
                  <linearGradient id="colorV" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorV)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-auto space-y-4">
            <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Crescimento</p>
                <span className="text-sm font-bold text-slate-600">vs Mês Anterior</span>
              </div>
              <span className={`text-2xl font-black ${growthPercentage >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {growthPercentage > 0 ? '+' : ''}{growthPercentage}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div >
  );
};

export default Dashboard;
