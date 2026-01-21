
import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Mail, Shield, ChevronRight, User as UserIcon, Trash2, AlertTriangle, Building2, Briefcase, FileDown, Users as UsersIcon, Key, Pencil, Check, X, ArrowLeft } from 'lucide-react';
import { User } from '../types';
import { getCompanyForUser } from '../utils/formatters';
import { exportUsersToExcel } from '../services/excelService';

interface UsersViewProps {
  users: User[];
  onDeleteUser: (email: string) => void;
  onUpdateUser: (email: string, data: Partial<User>) => void;
}

const UsersView: React.FC<UsersViewProps> = ({ users, onDeleteUser, onUpdateUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [selectedProfile, setSelectedProfile] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCompany, setEditCompany] = useState('');

  useEffect(() => {
    setIsEditing(false);
    setIsConfirmingDelete(false);
    if (selectedUser) {
      setEditName(selectedUser.name);
      setEditEmail(selectedUser.email);
      setEditCompany(getCompanyForUser(selectedUser));
    }
  }, [selectedUser]);

  const { companies, profiles } = useMemo(() => {
    const companiesSet = new Set<string>();
    const profilesSet = new Set<string>();
    
    users.forEach(user => {
      companiesSet.add(getCompanyForUser(user));
      user.accesses.forEach(acc => {
        if (acc.profile) profilesSet.add(acc.profile);
      });
    });

    return {
      companies: Array.from(companiesSet).sort(),
      profiles: Array.from(profilesSet).sort()
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users
      .filter(u => {
        const matchesSearch = 
          u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesCompany = 
          selectedCompany === 'all' || getCompanyForUser(u) === selectedCompany;
        
        const matchesProfile = 
          selectedProfile === 'all' || u.accesses.some(acc => acc.profile === selectedProfile);

        return matchesSearch && matchesCompany && matchesProfile;
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [users, searchTerm, selectedCompany, selectedProfile]);

  const handleExport = () => {
    if (filteredUsers.length === 0) return;
    exportUsersToExcel(filteredUsers);
  };

  const handleSaveEdit = () => {
    if (selectedUser) {
      const updatedUser = {
        ...selectedUser,
        name: editName,
        email: editEmail,
        company: editCompany
      };
      onUpdateUser(selectedUser.email, updatedUser);
      setSelectedUser(updatedUser);
      setIsEditing(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full min-h-[500px] lg:h-[calc(100vh-14rem)]">
      {/* Lista de Usuários - Esconde no mobile se tiver um usuário selecionado */}
      <div className={`
        lg:w-1/2 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden
        ${selectedUser ? 'hidden lg:flex' : 'flex'}
      `}>
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar usuário..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={handleExport}
              disabled={filteredUsers.length === 0}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 shadow-sm whitespace-nowrap"
            >
              <FileDown className="w-4 h-4" />
              <span>Exportar</span>
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <select
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white text-xs appearance-none cursor-pointer"
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
              >
                <option value="all">Todas as Empresas</option>
                {companies.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="flex-1 relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <select
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white text-xs appearance-none cursor-pointer"
                value={selectedProfile}
                onChange={(e) => setSelectedProfile(e.target.value)}
              >
                <option value="all">Todos os Perfis</option>
                {profiles.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between px-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <UsersIcon className="w-3 h-3" />
              {filteredUsers.length} encontrados
            </div>
            {(searchTerm || selectedCompany !== 'all' || selectedProfile !== 'all') && (
              <button 
                onClick={() => {setSearchTerm(''); setSelectedCompany('all'); setSelectedProfile('all');}}
                className="text-[10px] text-indigo-500 hover:text-indigo-700 font-bold uppercase underline"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Filter className="w-12 h-12 mx-auto mb-3 opacity-10" />
              <p className="text-sm">Nenhum registro encontrado.</p>
            </div>
          ) : (
            filteredUsers.map((user) => {
              const isKey = user.email.startsWith('vtexappkey');
              return (
                <button
                  key={user.email}
                  onClick={() => setSelectedUser(user)}
                  className={`w-full p-4 flex items-center justify-between transition-all hover:bg-slate-50 group ${
                    selectedUser?.email === user.email ? 'bg-indigo-50/50 lg:border-r-4 lg:border-r-indigo-500' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black uppercase shrink-0 transition-transform group-active:scale-95 ${
                      isKey ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'
                    }`}>
                      {isKey ? <Key className="w-5 h-5" /> : user.name.charAt(0)}
                    </div>
                    <div className="text-left overflow-hidden">
                      <p className="font-bold text-slate-800 text-sm truncate">{user.name}</p>
                      <p className="text-[10px] text-indigo-500 font-black uppercase tracking-tight">{getCompanyForUser(user)}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Detalhes do Usuário - Mobile Full Screen */}
      <div className={`
        lg:w-1/2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col
        ${selectedUser ? 'flex' : 'hidden lg:flex'}
      `}>
        {selectedUser ? (
          <>
            {/* Header Mobile para Voltar */}
            <div className="lg:hidden p-4 bg-slate-900 flex items-center gap-4 text-white">
               <button onClick={() => setSelectedUser(null)} className="p-2 -ml-2">
                 <ArrowLeft className="w-6 h-6" />
               </button>
               <h3 className="font-bold truncate">Detalhes do Acesso</h3>
            </div>

            <div className={`p-6 lg:p-8 shrink-0 relative transition-all duration-500 ${
              selectedUser.email.startsWith('vtexappkey') 
                ? 'bg-gradient-to-br from-amber-800 to-amber-950 text-white' 
                : 'bg-gradient-to-br from-slate-800 to-slate-900 text-white'
            }`}>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/20 shrink-0 shadow-2xl">
                  {selectedUser.email.startsWith('vtexappkey') ? <Key className="w-12 h-12" /> : <UserIcon className="w-12 h-12" />}
                </div>
                
                <div className="overflow-hidden flex-1 text-center sm:text-left">
                  {isEditing ? (
                    <div className="space-y-2">
                      <input 
                        type="text" 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-xl font-bold focus:bg-white/20 outline-none"
                      />
                      <input 
                        type="text" 
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-sm outline-none"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-3">
                        <span className={`px-2 py-0.5 text-[10px] font-black rounded-lg uppercase ${
                          selectedUser.email.startsWith('vtexappkey') ? 'bg-amber-500' : 'bg-indigo-500'
                        }`}>
                          {getCompanyForUser(selectedUser)}
                        </span>
                      </div>
                      <h3 className="text-2xl lg:text-3xl font-black truncate tracking-tight">{selectedUser.name}</h3>
                      <p className="text-slate-400 text-xs sm:text-sm mt-1 flex items-center justify-center sm:justify-start gap-2">
                        <Mail className="w-3.5 h-3.5" />
                        {selectedUser.email}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Botões de Ação Desktop/Mobile */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                {isEditing ? (
                  <button onClick={handleSaveEdit} className="p-2.5 bg-emerald-500 rounded-xl shadow-lg"><Check className="w-5 h-5" /></button>
                ) : (
                  <button onClick={() => setIsEditing(true)} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-all"><Pencil className="w-5 h-5" /></button>
                )}
                <button onClick={() => setIsConfirmingDelete(true)} className="p-2.5 bg-white/10 hover:bg-red-500 rounded-xl transition-all"><Trash2 className="w-5 h-5" /></button>
              </div>
            </div>

            <div className="p-6 lg:p-8 flex-1 overflow-y-auto bg-slate-50/30">
              {isConfirmingDelete ? (
                <div className="bg-white border border-red-100 rounded-3xl p-8 text-center shadow-xl">
                  <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h4 className="text-xl font-black text-slate-800">Apagar Registro?</h4>
                  <p className="text-sm text-slate-500 mb-8 mt-2 leading-relaxed">Isso removerá <strong>{selectedUser.name}</strong> permanentemente do Banco MySQL.</p>
                  <div className="flex gap-3">
                    <button onClick={() => setIsConfirmingDelete(false)} className="flex-1 py-3 bg-slate-100 rounded-2xl font-bold text-slate-600">Cancelar</button>
                    <button onClick={() => {onDeleteUser(selectedUser.email); setSelectedUser(null);}} className="flex-1 py-3 bg-red-600 text-white rounded-2xl font-bold shadow-lg shadow-red-200">Excluir</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sistemas Cruzados</h4>
                    <span className="text-[10px] font-black bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-100">
                      {selectedUser.accesses.length} CONEXÕES
                    </span>
                  </div>
                  <div className="space-y-4">
                    {selectedUser.accesses.map((access, idx) => (
                      <div key={idx} className="flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md hover:border-indigo-100 group">
                        <div className="flex items-center gap-4 overflow-hidden">
                          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0 border border-indigo-100 group-hover:scale-110 transition-transform">
                            <Shield className="w-6 h-6" />
                          </div>
                          <div className="overflow-hidden">
                            <p className="font-bold text-slate-800 truncate text-sm sm:text-base">{access.systemName}</p>
                            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase">{access.profile}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0 hidden sm:block">
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">Sincronia</p>
                          <p className="text-[11px] font-bold text-slate-500">{new Date(access.importedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-300">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 border-4 border-white shadow-inner">
               <UsersIcon className="w-12 h-12" />
            </div>
            <p className="text-xl font-black text-slate-400">Nenhum Usuário Selecionado</p>
            <p className="text-sm max-w-xs mt-2 text-slate-400">Selecione alguém na lista ao lado para visualizar o cruzamento inteligente de perfis.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersView;