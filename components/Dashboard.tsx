
import React from 'react';
import { Users, Server, FileText, TrendingUp } from 'lucide-react';
import { User, SystemData } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

interface DashboardProps {
  users: User[];
  systems: SystemData[];
}

const Dashboard: React.FC<DashboardProps> = ({ users, systems }) => {
  const stats = [
    { label: 'Total de Usuários', value: users.length, icon: Users, color: 'indigo' },
    { label: 'Sistemas Conectados', value: systems.length, icon: Server, color: 'blue' },
    { label: 'Importações Realizadas', value: systems.length, icon: FileText, color: 'emerald' },
    { label: 'Cruzamento de Perfis', value: users.reduce((acc, u) => acc + u.accesses.length, 0), icon: TrendingUp, color: 'amber' },
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart 1: Distribution */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
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

        {/* Chart 2: Summary Stats */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <h4 className="text-lg font-bold text-slate-800 mb-6">Status dos Sistemas</h4>
          <div className="flex-1 space-y-4">
            {systems.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400">
                Aguardando importações...
              </div>
            ) : (
              systems.map((sys, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full`} style={{backgroundColor: COLORS[idx % COLORS.length]}}></div>
                    <span className="font-semibold text-slate-700">{sys.name}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-sm text-slate-500">{sys.userCount} usuários</span>
                    <span className="text-xs text-slate-400">Última atualização: {new Date(sys.lastImport).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
