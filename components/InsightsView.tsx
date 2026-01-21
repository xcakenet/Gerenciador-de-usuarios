
import React, { useState, useEffect } from 'react';
import { ShieldAlert, Lightbulb, CheckCircle, BrainCircuit, RefreshCw } from 'lucide-react';
import { analyzeAccessData } from '../services/geminiService';
import { User } from '../types';

interface InsightsViewProps {
  users: User[];
}

const InsightsView: React.FC<InsightsViewProps> = ({ users }) => {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<any>(null);

  const fetchInsights = async () => {
    if (users.length === 0) return;
    setLoading(true);
    const result = await analyzeAccessData(users);
    setInsights(result);
    setLoading(false);
  };

  useEffect(() => {
    if (users.length > 0 && !insights) {
      fetchInsights();
    }
  }, [users]);

  if (users.length === 0) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500">
        <BrainCircuit className="w-16 h-16 mx-auto mb-4 text-indigo-300" />
        <p className="text-lg font-medium">Sem dados para analisar</p>
        <p>Importe planilhas para permitir que a IA analise riscos e perfis.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-indigo-600">
          <BrainCircuit className="w-8 h-8" />
          <h3 className="text-2xl font-bold">Análise Inteligente (IA)</h3>
        </div>
        <button 
          onClick={fetchInsights}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 text-sm font-medium transition-all"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Atualizar Análise
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-slate-100 rounded-2xl border border-slate-200"></div>
          ))}
        </div>
      ) : insights ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Riscos Section */}
          <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm">
            <div className="flex items-center gap-3 text-red-600 mb-4 font-bold">
              <ShieldAlert className="w-6 h-6" />
              <h4>Riscos Identificados</h4>
            </div>
            <div className="space-y-4">
              {insights.riscos.map((risco: any, i: number) => (
                <div key={i} className="p-4 bg-red-50 rounded-xl border border-red-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-red-800">{risco.titulo}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      risco.gravidade === 'Alta' ? 'bg-red-200 text-red-900' : 'bg-orange-200 text-orange-900'
                    }`}>
                      {risco.gravidade}
                    </span>
                  </div>
                  <p className="text-xs text-red-700 leading-relaxed">{risco.descricao}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Observações Section */}
          <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm">
            <div className="flex items-center gap-3 text-blue-600 mb-4 font-bold">
              <Lightbulb className="w-6 h-6" />
              <h4>Observações Gerais</h4>
            </div>
            <ul className="space-y-3">
              {insights.observacoes.map((obs: string, i: number) => (
                <li key={i} className="flex gap-3 text-sm text-slate-600 leading-relaxed">
                  <div className="mt-1 w-1.5 h-1.5 bg-blue-400 rounded-full shrink-0"></div>
                  {obs}
                </li>
              ))}
            </ul>
          </div>

          {/* Sugestões Section */}
          <div className="bg-white p-6 rounded-2xl border border-green-100 shadow-sm">
            <div className="flex items-center gap-3 text-green-600 mb-4 font-bold">
              <CheckCircle className="w-6 h-6" />
              <h4>Sugestões de Ajuste</h4>
            </div>
            <ul className="space-y-4">
              {insights.sugestoes.map((sug: string, i: number) => (
                <li key={i} className="p-3 bg-green-50 rounded-xl text-sm text-green-800 font-medium border border-green-100">
                  {sug}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-slate-400">
          Falha ao carregar análise. Tente novamente.
        </div>
      )}
    </div>
  );
};

export default InsightsView;
