
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
import { Database, RefreshCw, AlertCircle, CheckCircle2, Link2, WifiOff } from 'lucide-react';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewState>('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [systems, setSystems] = useState<SystemData[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const saveTimeoutRef = useRef<any>(null);
  
  const getInitialSyncKey = () => {
    const params = new URLSearchParams(window.location.search);
    const urlKey = params.get('ws');
    if (urlKey) {
      localStorage.setItem('accessinsight_workspace_id', urlKey);
      return urlKey;
    }
    return localStorage.getItem('accessinsight_workspace_id') || `principal`;
  };

  const [sync, setSync] = useState<SyncState>({
    enabled: true,
    syncKey: getInitialSyncKey(),
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
        // Fallback para backup local caso banco esteja vazio
        const localBackup = localStorage.getItem('accessinsight_users_backup');
        if (localBackup) {
          const parsed = JSON.parse(localBackup);
          setUsers(parsed.users || []);
          setSystems(parsed.systems || []);
        }
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
    localStorage.setItem('accessinsight_users_backup', JSON.stringify({ users: newUsers, systems: newSystems }));
    if (!sync.syncKey) return;
    
    setSync(prev => ({ ...prev, status: 'syncing' }));
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    saveTimeoutRef.current = setTimeout(async () => {
      const success = await saveToCloud(sync.syncKey, { users: newUsers, systems: newSystems });
      setSync(prev => ({ ...prev, status: success ? 'success' : 'error' }));
    }, 1500);
  }, [sync.syncKey]);

  const handleUpdateSyncKey = useCallback((key: string) => {
    setSync(prev => ({ ...prev, syncKey: key, status: 'idle' }));
    localStorage.setItem('accessinsight_workspace_id', key);
    const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?ws=' + key;
    window.history.pushState({ path: newUrl }, '', newUrl);
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
    if (confirm('Atenção! Isso apagará este workspace no banco de dados. Confirmar?')) {
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
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-900 text-white p-6">
        <Database className="w-12 h-12 animate-bounce text-indigo-500 mb-6" />
        <h1 className="text-xl font-bold">Conectando ao MySQL...</h1>
      </div>
    );
  }

  return (
    <Layout activeView={activeView} onNavigate={setActiveView}>
      <div className="mb-6 flex flex-col sm:flex-row items-center justify-between bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm gap-4">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl transition-all ${
            sync.status === 'error' ? 'bg-red-50 text-red-500' : 'bg-indigo-50 text-indigo-500'
          }`}>
            {sync.status === 'error' ? <WifiOff className="w-6 h-6" /> : <Database className={`w-6 h-6 ${sync.status === 'syncing' ? 'animate-pulse' : ''}`} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-slate-800">
                {sync.status === 'error' ? 'Conexão com Banco Falhou' : 'MySQL Ativo e Seguro'}
              </p>
              {sync.status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
            </div>
            <p className="text-[10px] text-slate-400 font-mono">Workspace: {sync.syncKey}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              const url = window.location.origin + window.location.pathname + '?ws=' + sync.syncKey;
              navigator.clipboard.writeText(url);
              alert('Link do MySQL copiado!');
            }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
          >
            <Link2 className="w-3.5 h-3.5" />
            Link de Convite
          </button>
          <button 
            onClick={fetchGlobalData}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-100"
          >
            Forçar Sincronização
          </button>
        </div>
      </div>

      {sync.status === 'error' && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-800">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div className="text-sm">
            <p className="font-bold">Erro de Conexão MySQL</p>
            <p className="opacity-80">Verifique se o arquivo <strong>api.php</strong> está no servidor e se as credenciais do banco estão corretas dentro dele.</p>
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
