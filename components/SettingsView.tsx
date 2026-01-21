
import React, { useState } from 'react';
import { Download, Upload, FileJson, Trash2, ShieldAlert, CheckCircle2, Cloud, RefreshCw, Key } from 'lucide-react';
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
              Configuração do Workspace Compartilhado
            </h3>
            <p className="text-slate-500 text-sm mt-1">
              Defina um Identificador Único para sua empresa. Todos que usarem este mesmo ID verão e editarão o mesmo banco de dados.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={localKey}
              onChange={(e) => setLocalKey(e.target.value.toLowerCase().replace(/\s/g, '-'))}
              placeholder="Ex: minha-empresa-acessos"
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono text-sm"
            />
          </div>
          <button 
            onClick={() => {
              onUpdateSyncKey(localKey);
              alert('ID do Workspace atualizado! O sistema irá recarregar os dados deste canal.');
            }}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
          >
            Salvar ID
          </button>
          <button 
            onClick={onManualSync}
            disabled={sync.status === 'syncing'}
            className="px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${sync.status === 'syncing' ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Usuários na Nuvem</p>
            <p className="text-2xl font-bold text-slate-800">{users.length}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Sistemas Ativos</p>
            <p className="text-2xl font-bold text-slate-800">{systems.length}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Status do Link</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-sm font-bold text-green-600">Sincronizado</span>
            </div>
          </div>
        </div>
      </div>

      {/* Traditional JSON Backup */}
      <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
            <FileJson className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800">Exportar Cópia de Segurança</h4>
            <p className="text-xs text-slate-500">Baixe um arquivo offline dos dados atuais para seu controle.</p>
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
          className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-bold text-sm hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-lg shadow-emerald-100"
        >
          <Download className="w-4 h-4" /> Baixar JSON
        </button>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 p-8 rounded-2xl border border-red-100 shadow-sm">
        <h3 className="text-lg font-bold text-red-800 mb-4 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5" />
          Zona de Perigo
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-red-900">Limpar Banco de Dados GLOBAL</p>
            <p className="text-xs text-red-700 mt-1">Isso apagará os dados do servidor para TODOS os usuários deste workspace.</p>
          </div>
          <button 
            onClick={() => {
              if (confirm('ATENÇÃO: Isso apagará os dados na nuvem para todos os usuários do seu workspace. Continuar?')) onClearData();
            }}
            className="px-6 py-2 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Apagar do Servidor
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 justify-center text-slate-400">
        <CheckCircle2 className="w-4 h-4" />
        <span className="text-xs font-medium">Os dados são compartilhados em tempo real via canal criptografado por ID.</span>
      </div>
    </div>
  );
};

export default SettingsView;
