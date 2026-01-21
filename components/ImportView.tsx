
import React, { useState } from 'react';
import { Upload, FileCheck, AlertCircle, Loader2 } from 'lucide-react';
import { parseExcelFile } from '../services/excelService';
import { ImportPreviewRow } from '../types';

interface ImportViewProps {
  onImportComplete: (systemName: string, data: ImportPreviewRow[]) => void;
}

const ImportView: React.FC<ImportViewProps> = ({ onImportComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [systemName, setSystemName] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<ImportPreviewRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setLoading(true);
      setError(null);
      try {
        const data = await parseExcelFile(selectedFile);
        setPreview(data.slice(0, 5));
      } catch (err) {
        setError("Erro ao ler planilha. Verifique o formato.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFinalImport = async () => {
    if (!file || !systemName.trim()) return;
    setLoading(true);
    try {
      const allData = await parseExcelFile(file);
      onImportComplete(systemName, allData);
      setFile(null);
      setSystemName('');
      setPreview([]);
    } catch (err) {
      setError("Falha na importação final.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-2xl mx-auto">
        <h3 className="text-xl font-bold text-slate-800 mb-6">Importar Novos Dados</h3>
        
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
              Nome do Sistema Correspondente
              <span className="text-red-500" title="Obrigatório">*</span>
            </label>
            <input
              type="text"
              required
              value={systemName}
              onChange={(e) => setSystemName(e.target.value)}
              placeholder="Ex: SAP, Slack, VTEX, Jira..."
              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all shadow-sm"
            />
            <p className="mt-1.5 text-[11px] text-slate-500">Este nome será usado para cruzar os dados com outras planilhas.</p>
          </div>

          <div 
            className={`border-2 border-dashed rounded-xl p-8 transition-all flex flex-col items-center justify-center gap-4 ${
              file 
                ? 'border-indigo-300 bg-indigo-50/30' 
                : 'border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-slate-100/50'
            }`}
          >
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
            />
            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center group">
              {loading ? (
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
              ) : file ? (
                <FileCheck className="w-12 h-12 text-indigo-500" />
              ) : (
                <Upload className="w-12 h-12 text-slate-400 group-hover:text-indigo-500 transition-colors" />
              )}
              <span className="mt-4 text-sm font-semibold text-slate-600 group-hover:text-indigo-600 transition-colors">
                {file ? file.name : 'Selecione a planilha (.xlsx)'}
              </span>
              {!file && <span className="text-xs text-slate-400 mt-1">Arraste ou clique para selecionar</span>}
            </label>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {preview.length > 0 && (
            <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <p className="text-sm font-semibold text-slate-700 mb-2">Pré-visualização dos dados detectados:</p>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">Email/Key</th>
                      <th className="px-3 py-2 text-left text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">Perfil</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-2 text-slate-700 font-medium">
                          {row.email !== 'N/A' ? row.email : (row.apiKey || 'N/A')}
                        </td>
                        <td className="px-3 py-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                            {row.profile}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <button
            disabled={!file || !systemName.trim() || loading}
            onClick={handleFinalImport}
            className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processando...</span>
              </>
            ) : (
              'Confirmar Importação'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportView;
