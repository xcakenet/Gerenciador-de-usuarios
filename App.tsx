import React, { useState, useCallback, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import UsersView from './components/UsersView';
import ImportView from './components/ImportView';
import InsightsView from './components/InsightsView';
import SettingsView from './components/SettingsView';
import { ViewState, User, SystemData, ImportPreviewRow, SyncState } from './types';
import { formatNameFromEmail } from './utils/formatters';
import { saveToCloud, loadFromCloud } from './services/syncService';
import { Cloud, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewState>('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [systems, setSystems] = useState<SystemData[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  // Fix: changed NodeJS.Timeout to any to resolve namespace error in browser environment
  const saveTimeoutRef = useRef<any>(null);
  
  const [sync, setSync] = useState<SyncState>({
    enabled: true,
    syncKey: localStorage.getItem('accessinsight_workspace_id') || `ws-${window.location.hostname.replace(/\./g, '-')}`,
    lastSync: localStorage.getItem('accessinsight_lastsync'),
    status: 'idle'
  });

  const fetchGlobalData = useCallback(async () => {
    if (!sync.syncKey) return;
    
    setSync(prev => ({ ...prev, status: 'syncing' }));
    try {
      const remoteData = await loadFromCloud(sync.syncKey);
      
      if (remoteData && remoteData.users) {
        setUsers(remoteData.users);
        setSystems(remoteData.systems || []);
        const now = new Date().toISOString();
        setSync(prev => ({ ...prev, status: 'success', lastSync: now }));
        localStorage.setItem('accessinsight_lastsync', now);
      } else {
        setSync(prev => ({ ...prev, status: 'idle' }));
      }
    } catch (e) {
      setSync(prev => ({ ...prev, status: 'error' }));
    } finally {
      setIsInitialLoading(false);
    }
  }, [sync.syncKey]);

  useEffect(() => {
    fetchGlobalData();
  }, [fetchGlobalData]);

  const persistToCloud = useCallback(async (newUsers: User[], newSystems: SystemData[]) => {
    if (!sync.syncKey) return;
    
    // Debounce para evitar múltiplas requisições rápidas ao importar
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    saveTimeoutRef.current = setTimeout(async () => {
      setSync(prev => ({ ...prev, status: 'syncing' }));
      const success = await saveToCloud(sync.syncKey, { users: newUsers, systems: newSystems });
      
      if (success) {
        const now = new Date().toISOString();
        setSync(prev => ({ ...prev, status: 'success', lastSync: now }));
        localStorage.setItem('accessinsight_lastsync', now);
      } else {
        setSync(prev => ({ ...prev, status: 'error' }));
        // Tenta salvar localmente como fallback
        localStorage.setItem('accessinsight_users_backup', JSON.stringify(newUsers));
      }
    }, 1000);
  }, [sync.syncKey]);

  const handleUpdateSyncKey = useCallback((key: string) => {
    setSync(prev => ({ ...prev, syncKey: key, status: 'idle' }));
    localStorage.setItem('accessinsight_workspace_id', key);
    // Recarregar dados do novo workspace
    setIsInitialLoading(true);
  }, []);

  const handleDeleteUser = useCallback((email: string) => {
    const updated = users.filter(u => u.email !== email);
    setUsers(updated);
    persistToCloud(updated, systems);
  }, [users, systems, persistToCloud]);

  const handleUpdateUser = useCallback((oldEmail: string, updatedData: Partial<User>) => {
    const updated = users.map(u => u.email === oldEmail ? { ...u, ...updatedData } : u);
    setUsers(updated);
    persistToCloud(updated, systems);
  }, [users, systems, persistToCloud]);

  const handleImportAll = useCallback((newUsers: User[], newSystems: SystemData[]) => {
    setUsers(newUsers);
    setSystems(newSystems);
    persistToCloud(newUsers, newSystems);
  }, [persistToCloud]);

  const handleClearData = useCallback(() => {
    if (confirm('Isso apagará permanentemente os dados do servidor para todos. Continuar?')) {
      setUsers([]);
      setSystems([]);
      persistToCloud([], []);
    }
  }, [persistToCloud]);

  const handleImport = useCallback((systemName: string, data: ImportPreviewRow[]) => {
    const importedAt = new Date().toISOString();
    
    const newSystems = [...systems];
    const systemIdx = newSystems.findIndex(s => s.name === systemName);
    if (systemIdx > -1) {
      newSystems[systemIdx] = { ...newSystems[systemIdx], userCount: data.length, lastImport: importedAt };
    } else {
      newSystems.push({ id: Date.now().toString(), name: systemName, userCount: data.length, lastImport: importedAt });
    }

    const updatedUsers = [...users];
    data.forEach(row => {
      let identifier = row.email?.trim().toLowerCase();
      if (row.apiKey && row.apiKey.toLowerCase().startsWith('vtexappkey')) identifier = row.apiKey;
      if (!identifier || identifier === 'n/a') return;

      const existingIdx = updatedUsers.findIndex(u => u.email.toLowerCase() === identifier.toLowerCase());
      const newAccess = { systemName, profile: row.profile || 'Sem Perfil', importedAt };

      if (existingIdx > -1) {
        const filtered = updatedUsers[existingIdx].accesses.filter(a => a.systemName !== systemName);
        updatedUsers[existingIdx] = { ...updatedUsers[existingIdx], accesses: [...filtered, newAccess] };
      } else {
        updatedUsers.push({
          email: identifier,
          name: formatNameFromEmail(identifier),
          company: row.roles || undefined,
          accesses: [newAccess]
        });
      }
    });

    setUsers(updatedUsers);
    setSystems(newSystems);
    persistToCloud(updatedUsers, newSystems);
    setActiveView('users');
  }, [users, systems, persistToCloud]);

  if (isInitialLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-900 text-white">
        <RefreshCw className="w-12 h-12 animate-spin text-indigo-500 mb-4" />
        <h1 className="text-xl font-bold">Iniciando Banco de Dados Global</h1>
        <p className="text-slate-400 text-sm mt-2 font-mono">ID: {sync.syncKey}</p>
      </div>
    );
  }

  return (
    <Layout activeView={activeView} onNavigate={setActiveView}>
      {/* Barra de Status Global Otimizada */}
      <div className="mb-6 flex items-center justify-between bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl transition-colors ${
            sync.status === 'error' ? 'bg-red-50 text-red-500' : 
            sync.status === 'syncing' ? 'bg-indigo-50 text-indigo-500' : 'bg-emerald-50 text-emerald-500'
          }`}>
            <Cloud className={`w-6 h-6 ${sync.status === 'syncing' ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-slate-800">Servidor Compartilhado</p>
              {sync.status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
            </div>
            <p className="text-[11px] font-mono text-slate-400">Canal: {sync.syncKey}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sincronização</p>
            <p className="text-xs font-semibold text-slate-600">
              {sync.status === 'syncing' ? 'Enviando dados...' : 
               sync.status === 'error' ? 'Falha na conexão' : 
               sync.lastSync ? `Hoje às ${new Date(sync.lastSync).toLocaleTimeString()}` : 'Nunca sincronizado'}
            </p>
          </div>
          <button 
            onClick={fetchGlobalData}
            disabled={sync.status === 'syncing'}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${sync.status === 'syncing' ? 'animate-spin' : ''}`} />
            Atualizar Tudo
          </button>
        </div>
      </div>

      {sync.status === 'error' && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 animate-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div className="text-sm">
            <p className="font-bold">Erro de Sincronização!</p>
            <p className="opacity-80">Verifique se o seu servidor permite conexões externas ou tente mudar o ID do Workspace nas Configurações.</p>
          </div>
        </div>
      )}

      {activeView === 'dashboard' && <Dashboard users={users} systems={systems} />}
      {activeView === 'users' && <UsersView users={users} onDeleteUser={handleDeleteUser} onUpdateUser={handleUpdateUser} />}
      {activeView === 'import' && <ImportView onImportComplete={handleImport} />}
      {activeView === 'insights' && <InsightsView users={users} />}
      {activeView === 'settings' && (
        <SettingsView 
          users={users} 
          systems={systems} 
          sync={sync}
          onImportAll={handleImportAll} 
          onClearData={handleClearData} 
          onUpdateSyncKey={handleUpdateSyncKey}
          onManualSync={fetchGlobalData}
        />
      )}
    </Layout>
  );
};

export default App;