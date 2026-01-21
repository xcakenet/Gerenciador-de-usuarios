
import React, { useState } from 'react';
import { Download, Upload, FileJson, Trash2, ShieldAlert, CheckCircle2, Cloud, RefreshCw, Key, Info } from 'lucide-react';
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

const SettingsView: React.FC<SettingsViewProps> = ({ users, systems, sync, onClearData, onUpdateSyncKey, onManualSync }) => {
  const [localKey, setLocalKey] = useState(sync.syncKey);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Cloud Sync Section */}
      <div className="bg-white p-8 rounded-2xl border border-indigo-100 shadow-sm ring-1 ring-indigo-50">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Cloud className="w-6 h-6 text-indigo-500" />
              Banco de Dados Global (Compartilhado)
            </h3>
            <p className="text-slate-500 text-sm mt-1">
              Este ID identifica seu banco de dados na nuvem. Compartilhe este ID com sua equipe para que todos vejam os mesmos dados.
            </p>
          </div>
        </div>

        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-6">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={localKey}
                onChange={(e) => setLocalKey(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                placeholder="Ex: banco-seguranca-vtex"
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono text-sm"
              />
            </div>
            <button 
              onClick={() => {
                if (localKey.length < 5) return alert('O ID precisa ter pelo menos 5 caracteres.');
                onUpdateSyncKey(localKey);
                alert('ID do Workspace alterado! O sistema tentará carregar os dados deste novo canal.');
              }}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
            >
              Conectar ID
            </button>
          </div>
          <div className="mt-4 flex items-start gap-2 text-xs text-slate-500">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-indigo-400" />
            <p>Se você colocar esta ferramenta em seu servidor, certifique-se de que os usuários usem o mesmo ID para verem as mesmas planilhas.</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Usuários Atuais</p>
            <p className="text-2xl font-bold text-slate-800">{users.length}</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Sistemas Cruzados</p>
            <p className="text-2xl font-bold text-slate-800">{systems.length}</p>
          </div>
          <div className={`p-4 rounded-xl border shadow-sm ${sync.status === 'error' ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Status do Link</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-3 h-3 rounded-full ${sync.status === 'error' ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`}></span>
              <span className={`text-sm font-bold ${sync.status === 'error' ? 'text-red-600' : 'text-emerald-600'}`}>
                {sync.status === 'error' ? 'Desconectado' : 'Operacional'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
              <FileJson className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800">Cópia de Segurança</h4>
              <p className="text-xs text-slate-500">Baixe um arquivo JSON com todos os dados.</p>
            </div>
          </div>
          <button 
            onClick={() => {
              const data = { users, systems, exportDate: new Date().toISOString() };
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `backup_acessos_${sync.syncKey}.json`;
              a.click();
            }}
            className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-100"
          >
            <Download className="w-4 h-4" /> Baixar JSON de Backup
          </button>
        </div>

        <div className="p-8 bg-red-50 rounded-2xl border border-red-100 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-red-100 text-red-600 rounded-xl">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-red-800">Reiniciar Workspace</h4>
              <p className="text-xs text-red-600">Apaga tudo do servidor global.</p>
            </div>
          </div>
          <button 
            onClick={onClearData}
            className="w-full py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-100"
          >
            <Trash2 className="w-4 h-4" /> Limpar Banco de Dados
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 justify-center text-slate-400">
        <CheckCircle2 className="w-4 h-4" />
        <span className="text-xs font-medium">Os dados são protegidos pelo ID do seu Workspace. Evite IDs genéricos como "teste" ou "admin".</span>
      </div>
    </div>
  );
};

export default SettingsView;
