
import React, { useState } from 'react';
import { Upload, FileCheck, AlertCircle, Loader2, Info } from 'lucide-react';
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
  const [hasSystemColumn, setHasSystemColumn] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setLoading(true);
      setError(null);
      try {
        const data = await parseExcelFile(selectedFile);
        setPreview(data.slice(0, 5));
        // Verifica se a planilha já contém nomes de sistema
        const hasSystem = data.some(row => !!row.systemName);
        setHasSystemColumn(hasSystem);
      } catch (err) {
        setError("Erro ao ler planilha. Verifique o formato.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFinalImport = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const allData = await parseExcelFile(file);
      
      // Se não há sistema definido no manual E nem na planilha, avisa
      const hasSystemAnywhere = systemName.trim() || allData.some(row => !!row.systemName);
      if (!hasSystemAnywhere) {
        setError("Identifique o sistema manualmente ou use uma planilha que contenha a coluna 'Sistema'.");
        setLoading(false);
        return;
      }

      onImportComplete(systemName, allData);
      setFile(null);
      setSystemName('');
      setPreview([]);
      setHasSystemColumn(false);
    } catch (err) {
      setError("Falha na importação final.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-2xl mx-auto">
        <h3 className="text-xl font-bold text-slate-800 mb-6">Importar Dados</h3>
        
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2">
              Nome do Sistema (Opcional)
              {hasSystemColumn && (
                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-black uppercase">Detectado na planilha</span>
              )}
            </label>
            <input
              type="text"
              value={systemName}
              onChange={(e) => setSystemName(e.target.value)}
              placeholder={hasSystemColumn ? "Usando nomes da planilha..." : "Ex: SAP, Slack, VTEX..."}
              className={`w-full px-4 py-2.5 bg-white border rounded-lg text-slate-900 placeholder:text-slate-400 focus:ring-4 outline-none transition-all shadow-sm ${
                hasSystemColumn ? 'border-emerald-200 focus:ring-emerald-50 focus:border-emerald-500' : 'border-slate-300 focus:ring-indigo-100 focus:border-indigo-500'
              }`}
            />
            <p className="mt-1.5 text-[11px] text-slate-500 flex items-center gap-1">
              <Info className="w-3 h-3" />
              {hasSystemColumn 
                ? 'Sistemas serão atribuídos automaticamente conforme cada linha da planilha.' 
                : 'Se deixado vazio, o sistema buscará a coluna "Sistema" no Excel.'}
            </p>
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
              {!file && <span className="text-xs text-slate-400 mt-1">Dica: Use o relatório exportado como base.</span>}
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
              <p className="text-sm font-semibold text-slate-700 mb-2">Exemplo de leitura:</p>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">Email</th>
                      <th className="px-3 py-2 text-left text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">Sistema</th>
                      <th className="px-3 py-2 text-left text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">Perfil</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-2 text-slate-700 font-medium truncate max-w-[120px]">
                          {row.email}
                        </td>
                        <td className="px-3 py-2">
                           <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${row.systemName ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                            {row.systemName || systemName || 'N/A'}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span className="text-slate-600 font-bold">
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
            disabled={!file || loading}
            onClick={handleFinalImport}
            className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processando...</span>
              </>
            ) : (
              'Confirmar Atualização'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportView;
