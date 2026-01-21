
import React, { useMemo } from 'react';
// Added missing CheckCircle import from lucide-react
import { Users, Server, FileText, TrendingUp, AlertTriangle, ShieldCheck, CheckCircle } from 'lucide-react';
import { User, SystemData } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { performLocalAnalysis } from '../services/analysisEngine';

interface DashboardProps {
  users: User[];
  systems: SystemData[];
}

const Dashboard: React.FC<DashboardProps> = ({ users, systems }) => {
  const localInsights = useMemo(() => performLocalAnalysis(users), [users]);
  
  const stats = [
    { label: 'Total de Usuários', value: users.length, icon: Users, color: 'indigo' },
    { label: 'Sistemas Conectados', value: systems.length, icon: Server, color: 'blue' },
    { label: 'Importações Realizadas', value: systems.length, icon: FileText, color: 'emerald' },
    { label: 'Cruzamentos Totais', value: users.reduce((acc, u) => acc + u.accesses.length, 0), icon: TrendingUp, color: 'amber' },
  ];

  const chartData = systems.map(s => ({ name: s.name, count: s.userCount }));
  const COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  return (
    <div className="space-y-8">
      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl bg-${stat.color}-50 text-${stat.color}-600`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
            <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
            <p className="text-3xl font-bold text-slate-800 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart 1: Distribution */}
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h4 className="text-lg font-bold text-slate-800 mb-6">Usuários por Sistema</h4>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Security Summary (Offline/Local) */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <h4 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            Saúde dos Acessos
          </h4>
          <div className="flex-1 space-y-4">
            {localInsights.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center gap-2">
                <CheckCircle className="w-12 h-12 text-emerald-100" />
                <p className="text-sm">Nenhum risco detectado nas planilhas atuais.</p>
              </div>
            ) : (
              localInsights.map((insight, idx) => (
                <div key={idx} className={`p-4 rounded-xl border flex items-start gap-3 ${
                  insight.type === 'danger' ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'
                }`}>
                  <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${
                    insight.type === 'danger' ? 'text-red-500' : 'text-amber-500'
                  }`} />
                  <div>
                    <p className={`text-sm font-bold ${
                      insight.type === 'danger' ? 'text-red-800' : 'text-amber-800'
                    }`}>{insight.title}</p>
                    <p className="text-[11px] text-slate-600 mt-1">{insight.description}</p>
                  </div>
                </div>
              ))
            )}
            
            <div className="mt-6 pt-6 border-t border-slate-100">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-2">Resumo dos Sistemas</p>
              {systems.slice(0, 3).map((sys, idx) => (
                <div key={idx} className="flex items-center justify-between py-1 text-xs">
                  <span className="text-slate-600 font-medium">{sys.name}</span>
                  <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold">{sys.userCount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
