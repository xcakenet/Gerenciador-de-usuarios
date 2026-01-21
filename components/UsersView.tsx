
import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Mail, Shield, ChevronRight, User as UserIcon, Trash2, AlertTriangle, Building2, Briefcase, FileDown, Users as UsersIcon, Key, Pencil, Check, X } from 'lucide-react';
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
  
  // States para edição
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCompany, setEditCompany] = useState('');

  // Reset states ao trocar de usuário
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

  const handleDeleteClick = () => {
    setIsConfirmingDelete(true);
    setIsEditing(false);
  };

  const confirmDelete = () => {
    if (selectedUser) {
      onDeleteUser(selectedUser.email);
      setSelectedUser(null);
      setIsConfirmingDelete(false);
    }
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
      // Atualiza o usuário selecionado localmente para refletir a mudança de e-mail imediatamente
      setSelectedUser(updatedUser);
      setIsEditing(false);
    }
  };

  const isFiltering = searchTerm !== '' || selectedCompany !== 'all' || selectedProfile !== 'all';

  return (
    <div className="flex gap-6 h-[calc(100vh-12rem)]">
      <div className="w-1/2 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou e-mail/key..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={handleExport}
              disabled={filteredUsers.length === 0}
              className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm whitespace-nowrap"
            >
              <FileDown className="w-4 h-4" />
              <span>Exportar</span>
            </button>
          </div>
          
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <select
                className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white text-xs appearance-none cursor-pointer"
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
                className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white text-xs appearance-none cursor-pointer"
                value={selectedProfile}
                onChange={(e) => setSelectedProfile(e.target.value)}
              >
                <option value="all">Todos os Perfis</option>
                {profiles.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between px-1 pt-1">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <UsersIcon className="w-3.5 h-3.5" />
              {isFiltering ? (
                <span>
                  Encontrado(s) <span className="text-indigo-600 font-bold">{filteredUsers.length}</span> resultado(s)
                </span>
              ) : (
                <span>Total de <span className="text-slate-800 font-bold">{users.length}</span> usuários</span>
              )}
            </div>
            {isFiltering && (
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCompany('all');
                  setSelectedProfile('all');
                }}
                className="text-[10px] text-indigo-500 hover:text-indigo-700 font-bold uppercase tracking-wider underline underline-offset-2"
              >
                Limpar Filtros
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Filter className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Nenhum resultado.</p>
            </div>
          ) : (
            filteredUsers.map((user) => {
              const isKey = user.email.startsWith('vtexappkey');
              return (
                <button
                  key={user.email}
                  onClick={() => {
                    setSelectedUser(user);
                  }}
                  className={`w-full p-4 flex items-center justify-between border-b border-slate-50 transition-colors hover:bg-indigo-50/50 ${
                    selectedUser?.email === user.email ? 'bg-indigo-50 border-r-4 border-r-indigo-500' : ''
                  }`}
                >
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold uppercase shrink-0 ${
                      isKey ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'
                    }`}>
                      {isKey ? <Key className="w-5 h-5" /> : user.name.charAt(0)}
                    </div>
                    <div className="text-left overflow-hidden">
                      <p className="font-semibold text-slate-800 truncate">{user.name}</p>
                      <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-tight mb-0.5">{getCompanyForUser(user)}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                      {user.accesses.length} SIST.
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="w-1/2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {selectedUser ? (
          <>
            <div className={`p-8 shrink-0 relative transition-all duration-300 ${
              selectedUser.email.startsWith('vtexappkey') 
                ? 'bg-gradient-to-br from-amber-800 to-amber-950 text-white' 
                : 'bg-gradient-to-br from-slate-800 to-slate-900 text-white'
            }`}>
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 shrink-0">
                  {selectedUser.email.startsWith('vtexappkey') ? <Key className="w-10 h-10" /> : <UserIcon className="w-10 h-10" />}
                </div>
                
                <div className="overflow-hidden flex-1">
                  {isEditing ? (
                    <div className="space-y-2 pr-12">
                      <input 
                        type="text" 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Nome"
                        className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-xl font-bold focus:bg-white/20 outline-none placeholder:text-white/40"
                      />
                      <input 
                        type="text" 
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        placeholder="E-mail ou API Key"
                        className="w-full bg-white/10 border border-white/20 rounded px-2 py-0.5 text-xs font-medium focus:bg-white/20 outline-none placeholder:text-white/40"
                      />
                      <input 
                        type="text" 
                        value={editCompany}
                        onChange={(e) => setEditCompany(e.target.value)}
                        placeholder="Empresa / Role"
                        className="w-full bg-white/10 border border-white/20 rounded px-2 py-0.5 text-[10px] font-bold uppercase focus:bg-white/20 outline-none placeholder:text-white/40"
                      />
                    </div>
                  ) : (
                    <>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase mb-2 inline-block ${
                        selectedUser.email.startsWith('vtexappkey') ? 'bg-amber-500' : 'bg-indigo-500'
                      }`}>
                        {getCompanyForUser(selectedUser)}
                      </span>
                      <h3 className="text-2xl font-bold truncate">{selectedUser.name}</h3>
                      <div className="flex items-center gap-4 mt-1 text-slate-300 text-sm">
                        <span className="flex items-center gap-1 truncate">
                          {selectedUser.email.includes('@') ? <Mail className="w-4 h-4" /> : <Key className="w-4 h-4" />}
                          {selectedUser.email}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                {isEditing ? (
                  <>
                    <button 
                      onClick={handleSaveEdit}
                      className="p-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors text-white shadow-lg"
                      title="Salvar Alterações"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setIsEditing(false)}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white"
                      title="Cancelar"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
                      title="Editar Dados"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={handleDeleteClick}
                      className="p-2 bg-white/5 hover:bg-red-500 rounded-lg transition-colors text-white/60 hover:text-white"
                      title="Excluir Registro"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="p-8 flex-1 overflow-y-auto">
              {isConfirmingDelete ? (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
                  <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h4 className="text-lg font-bold text-red-900 mb-2">Excluir Registro?</h4>
                  <p className="text-sm text-red-700 mb-6">Remover <strong>{selectedUser.name}</strong> e todos os seus vínculos?</p>
                  <div className="flex gap-3 justify-center">
                    <button onClick={() => setIsConfirmingDelete(false)} className="px-6 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50">Cancelar</button>
                    <button onClick={confirmDelete} className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 shadow-lg shadow-red-200">Excluir</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Acessos Cruzados</h4>
                    <span className="text-xs font-semibold px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg">
                      {selectedUser.accesses.length} vinculados
                    </span>
                  </div>
                  <div className="space-y-4">
                    {selectedUser.accesses.map((access, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 group transition-all hover:shadow-md hover:bg-white">
                        <div className="flex items-center gap-4 overflow-hidden">
                          <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-50 shadow-sm shrink-0">
                            <Shield className="w-6 h-6" />
                          </div>
                          <div className="overflow-hidden">
                            <p className="font-bold text-slate-800 truncate">{access.systemName}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] uppercase font-bold text-slate-400">Perfil:</span>
                              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded truncate">{access.profile}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Sincronizado</p>
                          <p className="text-xs font-medium text-slate-600">{new Date(access.importedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
               <UserIcon className="w-12 h-12 text-slate-200" />
            </div>
            <p className="text-lg font-medium">Selecione um usuário ou chave API</p>
            <p className="text-sm max-w-xs mt-2">Visualize os cruzamentos de perfil e empresa entre diferentes planilhas.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersView;
