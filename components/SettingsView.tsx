
import React, { useState } from 'react';
import { Download, Trash2, ShieldAlert, Cloud, Key, Info, Link2, Copy, Database } from 'lucide-react';
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

const SettingsView: React.FC<SettingsViewProps> = ({ users, systems, sync, onClearData, onUpdateSyncKey }) => {
  const [localKey, setLocalKey] = useState(sync.syncKey);

  const copyShareLink = () => {
    const url = window.location.origin + window.location.pathname + '?ws=' + sync.syncKey;
    navigator.clipboard.writeText(url);
    alert('Link de acesso direto ao Banco MySQL copiado!');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* MySQL Connection Section */}
      <div className="bg-white p-8 rounded-3xl border border-indigo-100 shadow-sm ring-1 ring-indigo-50">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-extrabold text-slate-800 flex items-center gap-3">
              <Database className="w-8 h-8 text-indigo-500" />
              Banco de Dados MySQL (Hostinger)
            </h3>
            <p className="text-slate-500 text-sm mt-1">
              Seus dados estão sendo salvos de forma privada no seu servidor Hostinger.
            </p>
          </div>
        </div>

        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-8">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Identificador do Banco (Workspace ID)</label>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={localKey}
                onChange={(e) => setLocalKey(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                placeholder="Ex: dabase-seguranca"
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-mono text-sm"
              />
            </div>
            <button 
              onClick={() => {
                if (localKey.length < 3) return alert('O ID é muito curto.');
                onUpdateSyncKey(localKey);
              }}
              className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
            >
              Atualizar Conexão
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
              <h4 className="font-bold text-lg">Acesso Direto ao MySQL</h4>
              <p className="text-sm text-indigo-100 mt-1 mb-4">Compartilhe este link para que outros usuários visualizem os mesmos dados do banco.</p>
              <div className="flex items-center gap-2 bg-black/20 p-2 rounded-xl border border-white/10 overflow-hidden">
                <code className="flex-1 text-xs truncate opacity-80 px-2 font-mono">
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
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registros no MySQL</p>
            <p className="text-3xl font-black text-slate-800 mt-1">{users.length}</p>
          </div>
          <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tabelas Ativas</p>
            <p className="text-3xl font-black text-slate-800 mt-1">{systems.length}</p>
          </div>
          <div className={`p-5 rounded-2xl border shadow-sm transition-colors ${sync.status === 'error' ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status Bridge</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xl font-black ${sync.status === 'error' ? 'text-red-600' : 'text-emerald-600'}`}>
                {sync.status === 'error' ? 'Offline' : 'Conectado'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-medium uppercase">api.php ativo</p>
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
              <h4 className="font-bold text-slate-800">Exportar Base</h4>
              <p className="text-xs text-slate-500">Extração completa para JSON.</p>
            </div>
          </div>
          <button 
            onClick={() => {
              const data = { users, systems, exportDate: new Date().toISOString() };
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = `backup_mysql_${sync.syncKey}.json`; a.click();
            }}
            className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
          >
            Baixar JSON
          </button>
        </div>

        <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-red-100 text-red-600 rounded-xl">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-red-800">Limpar Banco</h4>
              <p className="text-xs text-red-500">Isso apagará a linha no MySQL.</p>
            </div>
          </div>
          <button 
            onClick={onClearData}
            className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold text-sm hover:bg-red-700 transition-all shadow-lg shadow-red-100"
          >
            Zerar Workspace no MySQL
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
        <div className="flex items-center gap-2 text-indigo-700">
          <Info className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-widest">Configuração Técnica</span>
        </div>
        <p className="text-[11px] text-indigo-600 text-center max-w-lg leading-relaxed">
          Para garantir o funcionamento, certifique-se de que o arquivo <strong>api.php</strong> foi carregado na Hostinger com as credenciais corretas do seu banco MySQL criado no painel hPanel.
        </p>
      </div>
    </div>
  );
};

export default SettingsView;
