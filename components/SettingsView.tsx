
import React, { useState } from 'react';
import { Download, Upload, FileJson, FileCode, Trash2, ShieldAlert, CheckCircle2, Database, Cloud, CloudUpload, CloudDownload, RefreshCw, Smartphone } from 'lucide-react';
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

const SettingsView: React.FC<SettingsViewProps> = ({ users, systems, sync, onImportAll, onClearData, onUpdateSyncKey, onManualSync }) => {
  const [localKey, setLocalKey] = useState(sync.syncKey);

  const handleExportStandalone = () => {
    const data = JSON.stringify({ users, systems });
    const htmlContent = document.documentElement.outerHTML;
    // Injeta os dados no script data.js simulado dentro do HTML para o próximo carregamento
    const portableHtml = htmlContent.replace(
      'window.process = { env: { API_KEY: "" } };',
      `window.process = { env: { API_KEY: "" } };\nwindow.ACCESS_INSIGHT_DATA = ${data};`
    );
    
    const blob = new Blob([portableHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AccessInsight_Portatil.html`;
    a.click();
  };

  const handleUpdateKey = () => {
    onUpdateSyncKey(localKey);
    alert('Chave de sincronização atualizada!');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Cloud Sync Section */}
      <div className="bg-white p-8 rounded-2xl border border-indigo-100 shadow-sm ring-1 ring-indigo-50">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Cloud className="w-6 h-6 text-indigo-500" />
              Sincronização em Nuvem (Acesse de Qualquer Lugar)
            </h3>
            <p className="text-slate-500 text-sm mt-1">
              Crie uma chave privada para salvar seus dados na nuvem e acessá-los em qualquer dispositivo.
            </p>
          </div>
          {sync.lastSync && (
            <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 px-2 py-1 rounded">
              Última Sinc: {new Date(sync.lastSync).toLocaleTimeString()}
            </span>
          )}
        </div>

        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={localKey}
              onChange={(e) => setLocalKey(e.target.value)}
              placeholder="Digite sua chave secreta (mín. 6 caracteres)"
              className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono text-sm"
            />
          </div>
          <button 
            onClick={handleUpdateKey}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
          >
            Configurar Chave
          </button>
          <button 
            onClick={onManualSync}
            disabled={!sync.syncKey || sync.status === 'syncing'}
            className="px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {sync.status === 'syncing' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </button>
        </div>
        
        {sync.syncKey && (
          <div className="mt-4 flex items-center gap-2 text-xs text-indigo-600 font-medium bg-indigo-50 p-3 rounded-lg">
            <CheckCircle2 className="w-4 h-4" />
            Seu sistema está vinculado à chave: <span className="font-bold underline">{sync.syncKey}</span>. Os dados serão salvos automaticamente.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Portable App Export */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all group shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800">App Portátil (.html)</h4>
              <p className="text-[11px] text-slate-500">O sistema + seus dados em 1 arquivo</p>
            </div>
          </div>
          <p className="text-xs text-slate-600 mb-6 leading-relaxed">
            Gera um novo arquivo HTML que já vem com todos os seus dados atuais dentro dele. Perfeito para levar em um Pen Drive ou enviar por e-mail.
          </p>
          <button 
            onClick={handleExportStandalone}
            className="w-full py-2.5 bg-amber-500 text-white rounded-lg font-bold text-sm hover:bg-amber-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-100"
          >
            <Download className="w-4 h-4" /> Baixar App Completo
          </button>
        </div>

        {/* Traditional JSON Backup */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all group shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <FileJson className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800">Backup Manual (JSON)</h4>
              <p className="text-[11px] text-slate-500">Dados puros para importação</p>
            </div>
          </div>
          <p className="text-xs text-slate-600 mb-6 leading-relaxed">
            Exporta apenas o banco de dados. Útil para quem quer manipular os dados em outros sistemas ou fazer backups de segurança.
          </p>
          <button 
            onClick={() => {
              const data = { users, systems, exportDate: new Date().toISOString() };
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `backup_dados.json`;
              a.click();
            }}
            className="w-full py-2.5 bg-emerald-600 text-white rounded-lg font-bold text-sm hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-100"
          >
            <Download className="w-4 h-4" /> Exportar JSON
          </button>
        </div>
      </div>

      <div className="bg-red-50 p-8 rounded-2xl border border-red-100 shadow-sm">
        <h3 className="text-lg font-bold text-red-800 mb-4 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5" />
          Zona de Perigo
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-red-900">Limpar Banco de Dados Local</p>
            <p className="text-xs text-red-700 mt-1">Isso apagará todos os usuários e sistemas salvos neste navegador.</p>
          </div>
          <button 
            onClick={() => {
              if (confirm('Tem certeza que deseja apagar TODOS os dados salvos?')) onClearData();
            }}
            className="px-6 py-2 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Limpar Tudo
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
