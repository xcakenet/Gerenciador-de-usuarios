
import React, { useState, useEffect, useMemo } from 'react';
import { ShieldAlert, Lightbulb, CheckCircle, BrainCircuit, RefreshCw, Zap, ShieldCheck } from 'lucide-react';
import { analyzeAccessData } from '../services/geminiService';
import { performLocalAnalysis, LocalInsight } from '../services/analysisEngine';
import { User } from '../types';

interface InsightsViewProps {
  users: User[];
}

const InsightsView: React.FC<InsightsViewProps> = ({ users }) => {
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiInsights, setAiInsights] = useState<any>(null);

  const localInsights = useMemo(() => performLocalAnalysis(users), [users]);

  const fetchAIInsights = async () => {
    if (users.length === 0) return;
    setLoadingAI(true);
    const result = await analyzeAccessData(users);
    setAiInsights(result);
    setLoadingAI(false);
  };

  if (users.length === 0) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500">
        <BrainCircuit className="w-16 h-16 mx-auto mb-4 text-indigo-300" />
        <p className="text-lg font-medium">Sem dados para analisar</p>
        <p>Importe planilhas para permitir o cruzamento de perfis.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Local Analysis Section */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Análise de Regras Locais</h3>
            <p className="text-sm text-slate-500">Processamento instantâneo de cruzamento de dados</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {localInsights.map((insight, i) => (
            <div key={i} className={`p-6 rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md ${
              insight.type === 'danger' ? 'border-red-100' : 
              insight.type === 'warning' ? 'border-amber-100' : 'border-blue-100'
            }`}>
              <div className="flex items-start justify-between mb-4">
                <div className={`p-2 rounded-lg ${
                  insight.type === 'danger' ? 'bg-red-50 text-red-600' : 
                  insight.type === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                }`}>
                  {insight.type === 'danger' ? <ShieldAlert className="w-5 h-5" /> : 
                   insight.type === 'warning' ? <ShieldCheck className="w-5 h-5" /> : <Lightbulb className="w-5 h-5" />}
                </div>
                <span className="text-2xl font-black text-slate-200">{insight.count}</span>
              </div>
              <h4 className="font-bold text-slate-800 mb-2">{insight.title}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{insight.description}</p>
            </div>
          ))}
        </div>
      </section>

      <hr className="border-slate-200" />

      {/* AI Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Análise Profunda com IA</h3>
              <p className="text-sm text-slate-500">Identificação de padrões complexos e anomalias de segurança</p>
            </div>
          </div>
          <button 
            onClick={fetchAIInsights}
            disabled={loadingAI}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
          >
            {loadingAI ? <RefreshCw className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
            {aiInsights ? 'Atualizar Análise' : 'Iniciar Análise IA'}
          </button>
        </div>

        {loadingAI ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-slate-100 rounded-2xl border border-slate-200"></div>
            ))}
          </div>
        ) : aiInsights ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm">
              <div className="flex items-center gap-3 text-red-600 mb-4 font-bold">
                <ShieldAlert className="w-6 h-6" />
                <h4>Riscos da IA</h4>
              </div>
              <div className="space-y-4">
                {aiInsights.riscos.map((risco: any, i: number) => (
                  <div key={i} className="p-4 bg-red-50 rounded-xl border border-red-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-red-800">{risco.titulo}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-200 text-red-900 font-bold">
                        {risco.gravidade}
                      </span>
                    </div>
                    <p className="text-xs text-red-700 leading-relaxed">{risco.descricao}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm">
              <div className="flex items-center gap-3 text-blue-600 mb-4 font-bold">
                <Lightbulb className="w-6 h-6" />
                <h4>Observações IA</h4>
              </div>
              <ul className="space-y-3">
                {aiInsights.observacoes.map((obs: string, i: number) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-600 leading-relaxed">
                    <div className="mt-1 w-1.5 h-1.5 bg-blue-400 rounded-full shrink-0"></div>
                    {obs}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-green-100 shadow-sm">
              <div className="flex items-center gap-3 text-green-600 mb-4 font-bold">
                <CheckCircle className="w-6 h-6" />
                <h4>Otimizações</h4>
              </div>
              <ul className="space-y-4">
                {aiInsights.sugestoes.map((sug: string, i: number) => (
                  <li key={i} className="p-3 bg-green-50 rounded-xl text-sm text-green-800 font-medium border border-green-100">
                    {sug}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-12 rounded-2xl text-center text-slate-400">
            <p>Clique no botão acima para realizar uma análise preditiva utilizando inteligência artificial baseada nos cruzamentos detectados.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default InsightsView;
