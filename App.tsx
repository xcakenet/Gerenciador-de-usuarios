
import React, { useState, useCallback, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import UsersView from './components/UsersView';
import ImportView from './components/ImportView';
import InsightsView from './components/InsightsView';
import SettingsView from './components/SettingsView';
import { ViewState, User, SystemData, ImportPreviewRow, SyncState } from './types';
import { formatNameFromEmail } from './utils/formatters';
import { saveToCloud, loadFromCloud } from './services/syncService';
import { Cloud, RefreshCw, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewState>('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [systems, setSystems] = useState<SystemData[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  // O Workspace ID define quem compartilha os mesmos dados. 
  // Você pode fixar isso no código para sua empresa ou deixar o usuário definir nas configurações.
  const [sync, setSync] = useState<SyncState>({
    enabled: true,
    syncKey: localStorage.getItem('accessinsight_workspace_id') || 'default-workspace',
    lastSync: localStorage.getItem('accessinsight_lastsync'),
    status: 'idle'
  });

  // 1. CARREGAMENTO INICIAL DO BANCO GLOBAL
  const fetchGlobalData = useCallback(async () => {
    if (!sync.syncKey) return;
    
    setSync(prev => ({ ...prev, status: 'syncing' }));
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
    setIsInitialLoading(false);
  }, [sync.syncKey]);

  useEffect(() => {
    fetchGlobalData();
  }, [fetchGlobalData]);

  // 2. SALVAMENTO AUTOMÁTICO NO BANCO GLOBAL
  // Toda vez que 'users' ou 'systems' mudam, enviamos para a nuvem
  const persistToCloud = useCallback(async (newUsers: User[], newSystems: SystemData[]) => {
    if (!sync.syncKey) return;
    
    setSync(prev => ({ ...prev, status: 'syncing' }));
    const success = await saveToCloud(sync.syncKey, { users: newUsers, systems: newSystems });
    
    if (success) {
      const now = new Date().toISOString();
      setSync(prev => ({ ...prev, status: 'success', lastSync: now }));
      localStorage.setItem('accessinsight_lastsync', now);
    } else {
      setSync(prev => ({ ...prev, status: 'error' }));
    }
  }, [sync.syncKey]);

  const handleUpdateSyncKey = useCallback((key: string) => {
    setSync(prev => ({ ...prev, syncKey: key }));
    localStorage.setItem('accessinsight_workspace_id', key);
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
    setUsers([]);
    setSystems([]);
    persistToCloud([], []);
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
        <h1 className="text-xl font-bold">Carregando Banco de Dados Global...</h1>
        <p className="text-slate-400 text-sm mt-2">Sincronizando com o servidor compartilhado</p>
      </div>
    );
  }

  return (
    <Layout activeView={activeView} onNavigate={setActiveView}>
      {/* Barra de Status Global */}
      <div className="mb-6 flex items-center justify-between bg-white px-6 py-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${sync.status === 'error' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status do Workspace</p>
            <p className="text-sm font-bold text-slate-800">
              {sync.syncKey ? `Conectado ao canal: ${sync.syncKey}` : 'Aguardando Configuração'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {sync.lastSync && (
            <p className="text-[10px] text-slate-400 font-medium">Última sincronização: {new Date(sync.lastSync).toLocaleTimeString()}</p>
          )}
          <button 
            onClick={fetchGlobalData}
            className="flex items-center gap-2 px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${sync.status === 'syncing' ? 'animate-spin' : ''}`} />
            Sincronizar Agora
          </button>
        </div>
      </div>

      {sync.status === 'error' && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 animate-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">Erro ao salvar no servidor. Verifique sua conexão ou a chave do Workspace.</p>
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
