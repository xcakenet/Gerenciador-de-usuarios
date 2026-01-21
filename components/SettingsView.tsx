
import React from 'react';
// Added missing Database import
import { Download, Upload, FileJson, FileCode, Trash2, ShieldAlert, CheckCircle2, Database } from 'lucide-react';
import { User, SystemData } from '../types';

interface SettingsViewProps {
  users: User[];
  systems: SystemData[];
  onImportAll: (users: User[], systems: SystemData[]) => void;
  onClearData: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ users, systems, onImportAll, onClearData }) => {
  
  const handleExportJSON = () => {
    const data = { users, systems, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accessinsight_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleExportScript = () => {
    const data = { users, systems };
    const scriptContent = `// AccessInsight Data Script\nwindow.ACCESS_INSIGHT_DATA = ${JSON.stringify(data, null, 2)};`;
    const blob = new Blob([scriptContent], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data.js`;
    a.click();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.users && json.systems) {
          onImportAll(json.users, json.systems);
          alert('Dados importados com sucesso!');
        }
      } catch (err) {
        alert('Erro ao importar arquivo. Formato inválido.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
          <Database className="w-6 h-6 text-indigo-500" />
          Gerenciamento de Dados Portáteis
        </h3>
        <p className="text-slate-500 text-sm mb-8">
          Para acessar seus dados em qualquer navegador, você pode exportar um "Script de Dados" e mantê-lo na pasta da aplicação.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Export Script */}
          <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors group">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <FileCode className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800">Baixar data.js</h4>
                <p className="text-[11px] text-slate-500">Portabilidade Total</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              Gera um arquivo script. Se você colocar este arquivo na mesma pasta do sistema, ele carregará automaticamente em qualquer navegador.
            </p>
            <button 
              onClick={handleExportScript}
              className="w-full py-2.5 bg-white border border-indigo-200 text-indigo-600 rounded-lg font-bold text-sm hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" /> Exportar Script
            </button>
          </div>

          {/* Backup JSON */}
          <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 hover:border-emerald-300 transition-colors group">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <FileJson className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800">Backup JSON</h4>
                <p className="text-[11px] text-slate-500">Backup e Restauração</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              Exporta um arquivo de backup padrão que pode ser importado manualmente em qualquer momento.
            </p>
            <div className="flex gap-2">
              <button 
                onClick={handleExportJSON}
                className="flex-1 py-2.5 bg-white border border-emerald-200 text-emerald-600 rounded-lg font-bold text-sm hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Exportar
              </button>
              <label className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg font-bold text-sm hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4" /> Importar
                <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 p-8 rounded-2xl border border-red-100 shadow-sm">
        <h3 className="text-lg font-bold text-red-800 mb-4 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5" />
          Zona de Perigo
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-red-900">Limpar Banco de Dados Local</p>
            <p className="text-xs text-red-700 mt-1">Isso apagará todos os usuários e sistemas salvos no navegador. Esta ação é irreversível.</p>
          </div>
          <button 
            onClick={() => {
              if (confirm('Tem certeza que deseja apagar TODOS os dados salvos neste navegador?')) {
                onClearData();
              }
            }}
            className="px-6 py-2 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Limpar Tudo
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 justify-center text-slate-400">
        <CheckCircle2 className="w-4 h-4" />
        <span className="text-xs font-medium">Seus dados são processados apenas localmente e nunca saem do seu computador sem sua permissão.</span>
      </div>
    </div>
  );
};

export default SettingsView;
