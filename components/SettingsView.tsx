
import React from 'react';
import { Download, Trash2, ShieldAlert, Database, Info, RefreshCw, CheckCircle2 } from 'lucide-react';
import { User, SystemData, SyncState } from '../types';

interface SettingsViewProps {
  users: User[];
  systems: SystemData[];
  sync: SyncState;
  onImportAll: (users: User[], systems: SystemData[]) => void;
  onClearData: () => void;
  onUpdateSyncKey: (key: string) => void;
  onManualSync: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ users, systems, sync, onClearData, onManualSync }) => {
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
              Todos os usuários do sistema visualizam e editam a mesma base de dados MySQL na Hostinger.
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
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total de Registros</p>
            <p className="text-3xl font-black text-slate-800 mt-1">{users.length}</p>
          </div>
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sistemas Mapeados</p>
            <p className="text-3xl font-black text-slate-800 mt-1">{systems.length}</p>
          </div>
          <div className={`p-5 rounded-2xl border transition-colors ${sync.status === 'error' ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Conexão Hostinger</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xl font-black ${sync.status === 'error' ? 'text-red-600' : 'text-emerald-600'}`}>
                {sync.status === 'error' ? 'Erro' : 'Ativa'}
              </span>
              {sync.status !== 'error' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase">api.php pronto</p>
          </div>
        </div>
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

      <div className="p-6 bg-slate-900 rounded-3xl text-white">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-2 bg-indigo-500 rounded-lg">
            <Info className="w-5 h-5" />
          </div>
          <h4 className="font-bold">Nota sobre Sincronização</h4>
        </div>
        <p className="text-sm text-slate-400 leading-relaxed">
          Este sistema foi configurado para **Banco de Dados Único**. Isso significa que qualquer alteração feita aqui (importação, edição de nome ou exclusão) será refletida instantaneamente para todos os outros usuários que acessarem o site em qualquer navegador.
        </p>
      </div>
    </div>
  );
};

export default SettingsView;
