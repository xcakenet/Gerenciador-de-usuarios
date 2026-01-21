
import React, { useState } from 'react';
import { LayoutDashboard, Users, FileUp, ShieldCheck, Database, Settings, Menu, X, Lock } from 'lucide-react';
import { ViewState } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeView: ViewState;
  isUnlocked: boolean;
  onNavigate: (view: ViewState) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, onNavigate, isUnlocked }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard' as ViewState, label: 'Dashboard', icon: LayoutDashboard, protected: false },
    { id: 'users' as ViewState, label: 'Usuários', icon: Users, protected: false },
    { id: 'import' as ViewState, label: 'Importar Planilha', icon: FileUp, protected: true },
    { id: 'insights' as ViewState, label: 'IA Insights', icon: ShieldCheck, protected: false },
    { id: 'settings' as ViewState, label: 'Configurações', icon: Settings, protected: true },
  ];

  const handleNavigate = (view: ViewState) => {
    onNavigate(view);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden flex-col lg:flex-row">
      {/* Mobile Header */}
      <header className="lg:hidden h-16 bg-slate-900 text-white flex items-center justify-between px-4 shrink-0 shadow-lg z-50">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500 p-1.5 rounded-lg">
            <Database className="w-5 h-5" />
          </div>
          <h1 className="text-lg font-bold tracking-tight">AccessInsight</h1>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Sidebar */}
      <aside className={`
        fixed inset-0 z-40 lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out
        w-64 bg-slate-900 text-white flex flex-col shadow-xl
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="hidden lg:flex p-6 items-center gap-3">
          <div className="bg-indigo-500 p-2 rounded-lg">
            <Database className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">AccessInsight</h1>
        </div>
        
        <nav className="flex-1 px-4 py-8 lg:py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${
                activeView === item.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5" />
                <span className="font-medium text-sm">{item.label}</span>
              </div>
              {item.protected && !isUnlocked && (
                <Lock className="w-3.5 h-3.5 opacity-40" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800/50 rounded-xl p-4">
            <p className="text-[10px] uppercase font-bold text-slate-500 mb-1 tracking-wider">Acesso</p>
            <p className="text-sm font-semibold text-white flex items-center gap-2">
              {isUnlocked ? 'Administrador' : 'Somente Leitura'}
              {isUnlocked && <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>}
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
        )}

        <header className="hidden lg:flex h-16 bg-white border-b border-slate-200 items-center justify-between px-8 shrink-0">
          <h2 className="text-lg font-semibold text-slate-700 capitalize">
            {navItems.find(i => i.id === activeView)?.label}
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 uppercase tracking-tight">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Banco MySQL Ativo
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="lg:hidden text-2xl font-black text-slate-800 mb-6 px-1">
              {navItems.find(i => i.id === activeView)?.label}
            </h2>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
