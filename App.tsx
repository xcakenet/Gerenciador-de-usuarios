
import React, { useState, useCallback, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import UsersView from './components/UsersView';
import ImportView from './components/ImportView';
import InsightsView from './components/InsightsView';
import SettingsView from './components/SettingsView';
import { ViewState, User, SystemData, ImportPreviewRow } from './types';
import { formatNameFromEmail } from './utils/formatters';
import { saveToCloud, loadFromCloud } from './services/syncService';
import { Database, CheckCircle2, WifiOff, AlertCircle, RefreshCcw, Lock, Unlock, X } from 'lucide-react';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewState>('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [systems, setSystems] = useState<SystemData[]>([]);
  const [password, setPassword] = useState<string>('admin123');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error' | 'success'>('idle');
  const [showPasswordModal, setShowPasswordModal] = useState<{ target: ViewState } | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  
  const saveTimeoutRef = useRef<any>(null);

  const fetchGlobalData = useCallback(async () => {
    setSyncStatus('syncing');
    try {
      const remoteData = await loadFromCloud();
      if (remoteData) {
        setUsers(remoteData.users || []);
        setSystems(remoteData.systems || []);
        if (remoteData.password) setPassword(remoteData.password);
        setSyncStatus('success');
      } else {
        setSyncStatus('error');
      }
    } catch (e) {
      setSyncStatus('error');
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGlobalData();
    const interval = setInterval(fetchGlobalData, 45000);
    return () => clearInterval(interval);
  }, [fetchGlobalData]);

  const persistToCloud = useCallback(async (newUsers: User[], newSystems: SystemData[], newPassword?: string) => {
    setSyncStatus('syncing');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    saveTimeoutRef.current = setTimeout(async () => {
      const success = await saveToCloud({ 
        users: newUsers, 
        systems: newSystems, 
        password: newPassword || password 
      });
      setSyncStatus(success ? 'success' : 'error');
    }, 800);
  }, [password]);

  const handleNavigate = (view: ViewState) => {
    const protectedViews: ViewState[] = ['import', 'settings'];
    if (protectedViews.includes(view) && !isUnlocked) {
      setShowPasswordModal({ target: view });
    } else {
      setActiveView(view);
    }
  };

  const handleUnlock = () => {
    if (passwordInput === password) {
      setIsUnlocked(true);
      setActiveView(showPasswordModal?.target || 'dashboard');
      setShowPasswordModal(null);
      setPasswordInput('');
      setPasswordError(false);
    } else {
      setPasswordError(true);
      setTimeout(() => setPasswordError(false), 2000);
    }
  };

  const updatePassword = (newPass: string) => {
    setPassword(newPass);
    persistToCloud(users, systems, newPass);
  };

  const handleImport = useCallback((manualSystemName: string, data: ImportPreviewRow[]) => {
    const importedAt = new Date().toISOString();
    const currentUsers = [...users];
    const currentSystemsMap = new Map(systems.map(s => [s.name.toLowerCase(), s]));

    data.forEach(row => {
      let identifier = row.email?.trim().toLowerCase();
      if (!identifier || identifier === 'n/a') return;

      // Decide qual o nome do sistema para esta linha específica
      const finalSystemName = (row.systemName || manualSystemName || 'Sistema Indefinido').trim();
      const systemKey = finalSystemName.toLowerCase();

      // Atualiza contador de usuários por sistema no estado global de sistemas
      if (!currentSystemsMap.has(systemKey)) {
        currentSystemsMap.set(systemKey, { id: Date.now().toString() + Math.random(), name: finalSystemName, userCount: 0, lastImport: importedAt });
      }
      
      const systemData = currentSystemsMap.get(systemKey)!;
      systemData.lastImport = importedAt;

      const existingUserIdx = currentUsers.findIndex(u => u.email.toLowerCase() === identifier);
      const newAccess = { systemName: finalSystemName, profile: row.profile || 'Acesso Padrão', importedAt };

      if (existingUserIdx > -1) {
        const user = currentUsers[existingUserIdx];
        // Remove acesso antigo ao mesmo sistema se existir, para não duplicar dentro do usuário
        const otherAccesses = user.accesses.filter(a => a.systemName.toLowerCase() !== systemKey);
        
        currentUsers[existingUserIdx] = { 
          ...user, 
          accesses: [...otherAccesses, newAccess],
          name: (row.name && row.name !== 'N/A' && (user.name.includes('@') || user.name === 'N/A')) ? row.name : user.name,
          company: (row.company && row.company !== 'N/A') ? row.company : user.company
        };
      } else {
        currentUsers.push({
          email: identifier,
          name: (row.name && row.name !== 'N/A') ? row.name : formatNameFromEmail(identifier),
          company: (row.company && row.company !== 'N/A') ? row.company : undefined,
          accesses: [newAccess]
        });
      }
    });

    // Recalcula contagem de usuários por sistema após a importação massiva
    const finalSystems = Array.from(currentSystemsMap.values()).map(s => {
      const count = currentUsers.filter(u => u.accesses.some(a => a.systemName.toLowerCase() === s.name.toLowerCase())).length;
      return { ...s, userCount: count };
    });

    setUsers(currentUsers);
    setSystems(finalSystems);
    persistToCloud(currentUsers, finalSystems);
    setActiveView('users');
  }, [users, systems, persistToCloud]);

  if (isInitialLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-900 text-white">
        <Database className="w-12 h-12 animate-pulse text-indigo-500 mb-6" />
        <h1 className="text-xl font-bold">Conectando ao MySQL...</h1>
      </div>
    );
  }

  return (
    <Layout activeView={activeView} onNavigate={handleNavigate} isUnlocked={isUnlocked}>
      {/* Header Info */}
      <div className="mb-6 flex flex-col sm:flex-row items-center justify-between bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm gap-4">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl ${syncStatus === 'error' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
            <Database className={`w-6 h-6 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">Status do Banco MySQL</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              {syncStatus === 'success' ? 'Sincronizado' : syncStatus === 'syncing' ? 'Salvando...' : 'Erro de Conexão'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {isUnlocked && (
            <button onClick={() => setIsUnlocked(false)} className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all flex items-center gap-2">
              <Lock className="w-3.5 h-3.5" /> Bloquear
            </button>
          )}
          <button onClick={fetchGlobalData} className="flex-1 sm:flex-none px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100">
            <RefreshCcw className="w-3.5 h-3.5" /> Atualizar
          </button>
        </div>
      </div>

      {/* Views */}
      {activeView === 'dashboard' && <Dashboard users={users} systems={systems} />}
      {activeView === 'users' && <UsersView users={users} onDeleteUser={(e) => { const u = users.filter(u=>u.email!==e); setUsers(u); persistToCloud(u, systems); }} onUpdateUser={(e, d) => { const u = users.map(u=>u.email===e?{...u,...d}:u); setUsers(u); persistToCloud(u, systems); }} />}
      {activeView === 'import' && <ImportView onImportComplete={handleImport} />}
      {activeView === 'insights' && <InsightsView users={users} />}
      {activeView === 'settings' && (
        <SettingsView 
          users={users} 
          systems={systems} 
          sync={{ status: syncStatus, syncKey: 'Global', enabled: true, lastSync: null }}
          currentPassword={password}
          onUpdatePassword={updatePassword}
          onImportAll={(u, s) => { setUsers(u); setSystems(s); persistToCloud(u, s); }} 
          onClearData={() => { if(confirm('Zerar MySQL?')) { setUsers([]); setSystems([]); persistToCloud([], []); } }} 
          onUpdateSyncKey={() => {}} 
          onManualSync={fetchGlobalData}
        />
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-800">Área Restrita</h3>
              <p className="text-sm text-slate-500 mt-2">Insira a senha mestra para acessar as configurações e importações.</p>
              
              <div className="mt-8 space-y-4">
                <input 
                  type="password" 
                  autoFocus
                  placeholder="Senha de acesso"
                  className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-center font-bold text-lg outline-none transition-all ${
                    passwordError ? 'border-red-500 bg-red-50 text-red-600 ring-4 ring-red-100' : 'border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50'
                  }`}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                />
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowPasswordModal(null)}
                    className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleUnlock}
                    className="flex-1 py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-100"
                  >
                    Entrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
