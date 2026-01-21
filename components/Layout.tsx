
import React from 'react';
import { LayoutDashboard, Users, FileUp, ShieldCheck, Database } from 'lucide-react';
import { ViewState } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeView: ViewState;
  onNavigate: (view: ViewState) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, onNavigate }) => {
  const navItems = [
    { id: 'dashboard' as ViewState, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users' as ViewState, label: 'Usuários', icon: Users },
    { id: 'import' as ViewState, label: 'Importar Planilha', icon: FileUp },
    { id: 'insights' as ViewState, label: 'IA Insights', icon: ShieldCheck },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-indigo-500 p-2 rounded-lg">
            <Database className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">AccessInsight</h1>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeView === item.id 
                  ? 'bg-indigo-600 text-white shadow-lg' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800/50 rounded-xl p-4">
            <p className="text-xs text-slate-400 mb-1">Versão Pro</p>
            <p className="text-sm font-semibold text-white">Administrador</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <h2 className="text-lg font-semibold text-slate-700 capitalize">
            {navItems.find(i => i.id === activeView)?.label}
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Sistema Online
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
