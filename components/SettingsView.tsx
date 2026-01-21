
import React, { useState } from 'react';
import { Download, Upload, FileJson, Trash2, ShieldAlert, CheckCircle2, Cloud, RefreshCw, Key, Info, Link2, Copy } from 'lucide-react';
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

  const copyShareLink = () => {
    const url = window.location.origin + window.location.pathname + '?ws=' + sync.syncKey;
    navigator.clipboard.writeText(url);
    alert('Link compartilhado com sucesso!');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Cloud Sync Section */}
      <div className="bg-white p-8 rounded-3xl border border-indigo-100 shadow-sm ring-1 ring-indigo-50">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-extrabold text-slate-800 flex items-center gap-3">
              <Cloud className="w-8 h-8 text-indigo-500" />
              Banco de Dados Compartilhado
            </h3>
            <p className="text-slate-500 text-sm mt-1">
              Como você está na Hostinger, este ID é o que permite que outras pessoas acessem o mesmo painel.
            </p>
          </div>
        </div>

        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-8">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Chave do Workspace (ID Unico)</label>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={localKey}
                onChange={(e) => setLocalKey(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                placeholder="Ex: seguranca-empresa-x"
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-mono text-sm"
              />
            </div>
            <button 
              onClick={() => {
                if (localKey.length < 5) return alert('O ID precisa ter pelo menos 5 caracteres.');
                onUpdateSyncKey(localKey);
              }}
              className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
            >
              Salvar e Conectar
            </button>
          </div>
        </div>

        {/* Share Link Card */}
        <div className="bg-indigo-600 rounded-2xl p-6 text-white mb-8 shadow-xl shadow-indigo-200">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Link2 className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-lg">Compartilhar com a Equipe</h4>
              <p className="text-sm text-indigo-100 mt-1 mb-4">Envie o link abaixo para outras pessoas. Elas entrarão automaticamente neste workspace.</p>
              <div className="flex items-center gap-2 bg-black/20 p-2 rounded-xl border border-white/10 overflow-hidden">
                <code className="flex-1 text-xs truncate opacity-80 px-2">
                  {window.location.origin + window.location.pathname + '?ws=' + sync.syncKey}
                </code>
                <button 
                  onClick={copyShareLink}
                  className="p-2 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total de Dados</p>
            <p className="text-3xl font-black text-slate-800 mt-1">{users.length}</p>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">Usuários detectados</p>
          </div>
          <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sistemas Ativos</p>
            <p className="text-3xl font-black text-slate-800 mt-1">{systems.length}</p>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">Planilhas cruzadas</p>
          </div>
          <div className={`p-5 rounded-2xl border shadow-sm transition-colors ${sync.status === 'error' ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sincronização</p>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-3 h-3 rounded-full ${sync.status === 'error' ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`}></div>
              <span className={`text-xl font-black ${sync.status === 'error' ? 'text-red-600' : 'text-emerald-600'}`}>
                {sync.status === 'error' ? 'Offline' : 'Online'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-medium uppercase tracking-tighter">Via Servidor Cloud</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-sm hover:border-emerald-200 transition-all">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800">Cópia de Segurança</h4>
              <p className="text-xs text-slate-500">Salve um arquivo offline para emergências.</p>
            </div>
          </div>
          <button 
            onClick={() => {
              const data = { users, systems, exportDate: new Date().toISOString() };
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `backup_access_insight_${sync.syncKey}.json`;
              a.click();
            }}
            className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold text-sm hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-100"
          >
            Baixar Backup JSON
          </button>
        </div>

        <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-sm hover:border-red-200 transition-all">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-red-100 text-red-600 rounded-xl">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-red-800">Limpeza de Workspace</h4>
              <p className="text-xs text-red-500">Remove todos os dados deste canal.</p>
            </div>
          </div>
          <button 
            onClick={onClearData}
            className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold text-sm hover:bg-red-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-100"
          >
            Apagar Tudo da Nuvem
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 justify-center text-slate-400 bg-slate-100/50 py-4 rounded-2xl">
        <Info className="w-4 h-4 text-indigo-400" />
        <span className="text-xs font-bold uppercase tracking-widest">Segurança: Dados criptografados pelo seu ID exclusivo.</span>
      </div>
    </div>
  );
};

export default SettingsView;
