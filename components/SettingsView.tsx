
import React, { useState } from 'react';
import { Download, Trash2, ShieldAlert, Database, Info, RefreshCw, CheckCircle2, Lock, Save, Eye, EyeOff } from 'lucide-react';
import { User, SystemData, SyncState } from '../types';

interface SettingsViewProps {
  users: User[];
  systems: SystemData[];
  sync: SyncState;
  currentPassword?: string;
  onUpdatePassword: (newPass: string) => void;
  onImportAll: (users: User[], systems: SystemData[]) => void;
  onClearData: () => void;
  onUpdateSyncKey: (key: string) => void;
  onManualSync: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ users, systems, sync, onClearData, onManualSync, currentPassword, onUpdatePassword }) => {
  const [newPass, setNewPass] = useState(currentPassword || '');
  const [showPass, setShowPass] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSavePassword = () => {
    if (newPass.length < 4) {
      alert('A senha deve ter pelo menos 4 caracteres.');
      return;
    }
    setIsSaving(true);
    onUpdatePassword(newPass);
    setTimeout(() => setIsSaving(false), 1000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* MySQL Global Section */}
      <div className="bg-white p-8 rounded-3xl border border-indigo-100 shadow-sm ring-1 ring-indigo-50">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <div className="text-center md:text-left">
            <h3 className="text-2xl font-extrabold text-slate-800 flex items-center justify-center md:justify-start gap-3">
              <Database className="w-8 h-8 text-indigo-500" />
              Banco de Dados Central
            </h3>
            <p className="text-slate-500 text-sm mt-1">
              Todos os usuários do sistema visualizam e editam a mesma base de dados MySQL.
            </p>
          </div>
          <button 
            onClick={onManualSync}
            className="px-6 py-3 bg-indigo-50 text-indigo-600 rounded-2xl font-bold text-sm hover:bg-indigo-100 transition-all flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${sync.status === 'syncing' ? 'animate-spin' : ''}`} />
            Sincronizar Agora
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-center md:text-left">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total de Registros</p>
            <p className="text-3xl font-black text-slate-800 mt-1">{users.length}</p>
          </div>
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-center md:text-left">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sistemas Mapeados</p>
            <p className="text-3xl font-black text-slate-800 mt-1">{systems.length}</p>
          </div>
          <div className={`p-5 rounded-2xl border transition-colors text-center md:text-left ${sync.status === 'error' ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status MySQL</p>
            <div className="flex items-center justify-center md:justify-start gap-2 mt-1">
              <span className={`text-xl font-black ${sync.status === 'error' ? 'text-red-600' : 'text-emerald-600'}`}>
                {sync.status === 'error' ? 'Erro' : 'Online'}
              </span>
              {sync.status !== 'error' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
            </div>
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800">Segurança do Sistema</h4>
            <p className="text-xs text-slate-500">Alterar a senha mestra para acesso às áreas restritas.</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <input 
              type={showPass ? 'text' : 'password'}
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              className="w-full pl-4 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
              placeholder="Nova senha mestra"
            />
            <button 
              onClick={() => setShowPass(!showPass)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500"
            >
              {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <button 
            onClick={handleSavePassword}
            disabled={isSaving}
            className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar Senha
          </button>
        </div>
        <p className="mt-3 text-[11px] text-slate-400 italic font-medium">* Essa senha será solicitada sempre que alguém tentar acessar as abas de Importação ou Configurações.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800">Backup Completo</h4>
              <p className="text-xs text-slate-500">Baixar cópia local em JSON.</p>
            </div>
          </div>
          <button 
            onClick={() => {
              const data = { users, systems, exportDate: new Date().toISOString() };
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = `backup_accessinsight_${new Date().toISOString().split('T')[0]}.json`; a.click();
            }}
            className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
          >
            Exportar JSON
          </button>
        </div>

        <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-red-100 text-red-600 rounded-xl">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-red-800">Limpar Banco de Dados</h4>
              <p className="text-xs text-red-500">Ação irreversível no servidor.</p>
            </div>
          </div>
          <button 
            onClick={onClearData}
            className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold text-sm hover:bg-red-700 transition-all shadow-lg shadow-red-100"
          >
            Zerar Todo o Sistema
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
