import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import { Book, Plus, Settings, Globe, ShieldAlert, KeyRound, Mail, X, Loader2, ArrowLeft, Lock, Unlock, Trash2, CheckSquare, AlertTriangle, User, LogOut } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { t, LanguageCode } from '../lib/i18n';
import { useStudio } from '../context/StudioContext';
import { db, auth } from '../lib/firebase';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export function LibraryScreen({ onSelectProject }: { onSelectProject: (id: string, language: LanguageCode) => void }) {
  const { user, language } = useStudio();

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('inkwell-projects');
    return saved ? JSON.parse(saved) : [];
  });
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newLang, setNewLang] = useState<LanguageCode>('en');

  // Security Verification states (Book Deletion & Account Deletion)
  const [verifyingProjectId, setVerifyingProjectId] = useState<string | null>(null);
  const [verifyingProjectName, setVerifyingProjectName] = useState<string>('');
  
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [existingPassword, setExistingPassword] = useState<string>('');
  
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [passwordSetupMode, setPasswordSetupMode] = useState(false);
  
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  // Account deletion states
  const [emailInput, setEmailInput] = useState('');
  const [doubleConfirmChecked, setDoubleConfirmChecked] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  // Auto load security password whenever modal mounts
  useEffect(() => {
    const loadPassword = async () => {
      setVerificationLoading(true);
      setVerificationError(null);
      try {
        if (user) {
          const docRef = doc(db, 'users', user.uid, 'settings', 'security');
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && docSnap.data().password) {
            setExistingPassword(docSnap.data().password);
            setHasPassword(true);
            setPasswordSetupMode(false);
          } else {
            setHasPassword(false);
            setExistingPassword('');
            setPasswordSetupMode(true);
          }
        } else {
          const savedPass = localStorage.getItem('inkwell-security-password');
          if (savedPass) {
            setExistingPassword(savedPass);
            setHasPassword(true);
            setPasswordSetupMode(false);
          } else {
            setHasPassword(false);
            setExistingPassword('');
            setPasswordSetupMode(true);
          }
        }
      } catch (err: any) {
        console.error("Failed to load security profile:", err);
        setVerificationError(t(language, 'fetchSecurityFailed'));
      } finally {
        setVerificationLoading(false);
      }
    };

    if (verifyingProjectId || isDeletingAccount) {
      setPasswordInput('');
      setConfirmPasswordInput('');
      setEmailInput('');
      setDoubleConfirmChecked(false);
      setConfirmText('');
      loadPassword();
    }
  }, [verifyingProjectId, isDeletingAccount, user]);

  const saveNewPassword = async () => {
    if (passwordInput.length < 4) {
      setVerificationError(t(language, 'passwordLengthError'));
      return;
    }
    if (passwordInput !== confirmPasswordInput) {
      setVerificationError(t(language, 'passwordsDoNotMatch'));
      return;
    }

    setVerificationLoading(true);
    setVerificationError(null);

    try {
      if (user) {
        const docRef = doc(db, 'users', user.uid, 'settings', 'security');
        await setDoc(docRef, { password: passwordInput }, { merge: true });
      } else {
        localStorage.setItem('inkwell-security-password', passwordInput);
      }
      setExistingPassword(passwordInput);
      setHasPassword(true);
      setPasswordSetupMode(false);
      setPasswordInput('');
      setConfirmPasswordInput('');
      alert(t(language, 'securityPasswordSuccess'));
    } catch (err: any) {
      console.error(err);
      setVerificationError(t(language, 'savePasswordFailed', { error: err.message }));
    } finally {
      setVerificationLoading(false);
    }
  };

  const confirmBookDeletion = async () => {
    if (!passwordInput.trim()) {
      setVerificationError(t(language, 'enterSecurityPassword'));
      return;
    }
    if (passwordInput !== existingPassword) {
      setVerificationError(t(language, 'incorrectPassword'));
      return;
    }

    setVerificationLoading(true);
    setVerificationError(null);

    try {
      // Perform actual book deletion from local projects
      const updated = projects.filter(p => p.id !== verifyingProjectId);
      setProjects(updated);
      localStorage.setItem('inkwell-projects', JSON.stringify(updated));
      
      // Cleanup associated local records
      localStorage.removeItem(`inkwell-files-${verifyingProjectId}`);
      localStorage.removeItem(`inkwell-snippets-${verifyingProjectId}`);
      localStorage.removeItem(`inkwell-glossary-${verifyingProjectId}`);
      localStorage.removeItem(`inkwell-versions-${verifyingProjectId}`);
      
      // Success: close modal
      setVerifyingProjectId(null);
      setPasswordInput('');
      alert(t(language, 'projectDeletedSuccess', { name: verifyingProjectName }));
    } catch (error: any) {
      setVerificationError(error.message);
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleAccountDeletion = async () => {
    const targetEmail = user?.email || "guest";
    if (emailInput.trim().toLowerCase() !== targetEmail.toLowerCase()) {
      setVerificationError(t(language, 'emailMismatch', { email: targetEmail }));
      return;
    }
    if (passwordInput !== existingPassword) {
      setVerificationError(t(language, 'incorrectSecurityPassword'));
      return;
    }
    if (!doubleConfirmChecked) {
      setVerificationError(t(language, 'checkDeclaration'));
      return;
    }
    if (confirmText.trim().toLowerCase() !== 'delete') {
      setVerificationError(t(language, 'typeDelete'));
      return;
    }

    setVerificationLoading(true);
    setVerificationError(null);

    try {
      // 1. Purge Library projects and local storage keys
      projects.forEach(p => {
        localStorage.removeItem(`inkwell-files-${p.id}`);
        localStorage.removeItem(`inkwell-snippets-${p.id}`);
        localStorage.removeItem(`inkwell-glossary-${p.id}`);
        localStorage.removeItem(`inkwell-versions-${p.id}`);
        localStorage.removeItem(`inkwell-assets-${p.id}`);
        localStorage.removeItem(`inkwell-custom-fonts-${p.id}`);
        localStorage.removeItem(`inkwell-component-fonts-${p.id}`);
        localStorage.removeItem(`inkwell-default-font-${p.id}`);
      });
      localStorage.removeItem('inkwell-projects');
      localStorage.removeItem('inkwell-security-password');
      localStorage.removeItem('inkwell-oobe-seen');
      localStorage.removeItem('inkwell-tutorial-seen');

      // 2. Erase Firestore workspace documents if authenticated
      if (user) {
        const securityRef = doc(db, 'users', user.uid, 'settings', 'security');
        await deleteDoc(securityRef);
        const infoRef = doc(db, 'users', user.uid, 'settings', 'info');
        await deleteDoc(infoRef);
      }

      // 3. Delete Firebase Authenticated Account if possible
      if (user && auth.currentUser) {
        try {
          await deleteUser(auth.currentUser);
        } catch (authErr) {
          console.warn("Auth user delete skipped (or requires re-authentication). Signing out instead.", authErr);
          await auth.signOut();
        }
      }

      alert(t(language, 'accountDeletedSuccess'));
      
      // Force complete reload and clear URL params
      localStorage.clear();
      window.location.href = '/'; 
    } catch (err: any) {
      console.error(err);
      setVerificationError(t(language, 'accountDeletionFailed', { error: err.message }));
    } finally {
      setVerificationLoading(false);
    }
  };

  const createProject = () => {
    if (!newTitle.trim()) return;
    const p: Project = {
      id: uuidv4(),
      name: newTitle.trim(),
      language: newLang,
      lastModified: Date.now()
    };
    const updated = [...projects, p];
    setProjects(updated);
    localStorage.setItem('inkwell-projects', JSON.stringify(updated));
    setShowNew(false);
    onSelectProject(p.id, p.language);
  };

  const deleteProject = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setVerifyingProjectId(id);
    setVerifyingProjectName(name);
  };

  return (
    <div className="w-screen h-screen bg-white dark:bg-[#09090b] text-zinc-900 dark:text-[#e4e4e7] flex items-center justify-center p-8">
      <div className="w-full max-w-4xl flex flex-col h-full">
        <header className="flex items-center justify-between py-6 mb-8 border-b border-zinc-200 dark:border-[#27272a]">
          <div className="flex items-center gap-3">
            <Book className="w-8 h-8 text-indigo-500" />
            <h1 className="text-2xl font-bold font-serif">{t(language, 'inkwellLibrary')}</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* User Session & Account Deletion area */}
            {user ? (
              <div className="flex items-center gap-3 bg-zinc-50 dark:bg-[#121214] border border-zinc-200 dark:border-[#27272a] px-3 py-1.5 rounded-lg text-sm">
                <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400 font-semibold">{user.email}</span>
                <button
                  onClick={() => logout()}
                  className="text-xs font-semibold text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {t(language, 'logout')}
                </button>
                <button
                  onClick={() => setIsDeletingAccount(true)}
                  className="text-xs font-semibold text-red-500 hover:text-red-400 border border-red-500/10 hover:border-red-500/30 bg-red-500/5 px-2.5 py-1 rounded-md transition-colors"
                >
                  {t(language, 'deleteAccount')}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-zinc-50 dark:bg-[#121214] border border-zinc-200 dark:border-[#27272a] px-3 py-1.5 rounded-lg text-xs text-zinc-500">
                <button
                    onClick={() => login()}
                    className="font-semibold text-indigo-500 hover:text-indigo-400 transition-colors"
                >
                  {t(language, 'login')}
                </button>
                <span>{t(language, 'writingAsGuest')}</span>
                <button
                  onClick={() => setIsDeletingAccount(true)}
                  className="font-semibold text-red-500 hover:text-red-400 border border-red-500/10 hover:border-red-500/30 bg-red-500/5 px-2 py-0.5 rounded transition-colors"
                >
                  {t(language, 'deleteData')}
                </button>
              </div>
            )}

            <button 
              onClick={() => setShowNew(true)}
              className="bg-indigo-600 hover:bg-indigo-500 transition-colors text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              {t(language, 'newProject')}
            </button>
          </div>
        </header>

        {showNew && (
          <div className="mb-8 p-6 bg-zinc-50 dark:bg-[#121214] border border-zinc-200 dark:border-[#27272a] rounded-xl flex items-end gap-4 shadow-xl">
            <div className="flex-1 space-y-2">
              <label className="text-xs font-semibold text-zinc-500 uppercase">{t(language, 'bookTitle')}</label>
              <input 
                type="text" 
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                autoFocus
                className="w-full bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] rounded-lg px-4 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
                placeholder={t(language, 'theGreatNovel')}
              />
            </div>
            <div className="w-48 space-y-2">
              <label className="text-xs font-semibold text-zinc-500 uppercase">{t(language, 'language')}</label>
              <select 
                value={newLang}
                onChange={e => setNewLang(e.target.value as LanguageCode)}
                className="w-full bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] rounded-lg px-4 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 appearance-none"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="nl">Nederlands</option>
                <option value="ko">한국어</option>
                <option value="ja">日本語</option>
              </select>
            </div>
            <button 
              onClick={createProject}
              className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold px-6 py-2 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200"
            >
              {t(language, 'create')}
            </button>
            <button 
              onClick={() => setShowNew(false)}
              className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 font-medium px-4 py-2"
            >
              {t(language, 'cancel')}
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {projects.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <Book className="w-16 h-16 text-zinc-300 dark:text-zinc-800" />
              <h2 className="text-xl font-semibold text-zinc-400 dark:text-zinc-500">{t(language, 'libraryEmpty')}</h2>
              <p className="text-zinc-500 dark:text-zinc-600 max-w-sm">{t(language, 'libraryEmptyDesc')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.sort((a,b) => b.lastModified - a.lastModified).map(project => (
                <div 
                  key={project.id}
                  onClick={() => onSelectProject(project.id, project.language)}
                  className="bg-zinc-50 dark:bg-[#121214] border border-zinc-200 dark:border-[#27272a] rounded-xl p-6 cursor-pointer hover:border-indigo-500 transition-colors group relative flex flex-col h-48"
                >
                  <div className="flex justify-between items-start mb-4">
                    <Book className="w-8 h-8 text-zinc-400 dark:text-zinc-600 group-hover:text-indigo-400 transition-colors" />
                    <button 
                      onClick={(e) => deleteProject(project.id, project.name, e)}
                      className="p-2 text-zinc-400 hover:text-red-400 transition-all rounded hover:bg-zinc-200 dark:hover:bg-zinc-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h3 className="text-lg font-bold font-serif mb-1 line-clamp-2 text-zinc-900 dark:text-zinc-100">{project.name}</h3>
                  <div className="mt-2 text-xs text-zinc-500" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="number"
                      placeholder="Daily Goal"
                      className="bg-transparent border-b border-zinc-700 w-20 px-1 text-xs"
                      defaultValue={project.dailyWordCountGoal}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        const updated = projects.map(p => p.id === project.id ? {...p, dailyWordCountGoal: val} : p);
                        setProjects(updated);
                        localStorage.setItem('inkwell-projects', JSON.stringify(updated));
                      }}
                    />
                  </div>
                  <div className="mt-auto flex items-center justify-between text-xs text-zinc-500">
                    <div className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" />
                      <span className="uppercase font-semibold">{project.language}</span>
                    </div>
                    <span>{new Date(project.lastModified).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-12">
            <h3 className="text-lg font-semibold mb-6">Word Count Progress</h3>
            {projects.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projects.map(p => ({ ...p }))}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="dailyWordCountGoal" fill="#6366f1" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-zinc-500 text-sm italic">
                No projects to visualize yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Safety Verification Modals */}
      {(verifyingProjectId || isDeletingAccount) && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9000] p-4 text-zinc-950 dark:text-zinc-50 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#121214] w-full max-w-md border border-zinc-200 dark:border-[#27272a] rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-[#27272a]">
              <h3 className="text-md font-semibold flex items-center gap-2.5">
                <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" />
                <span>
                  {passwordSetupMode 
                    ? t(language, 'initSecurityPassword') 
                    : isDeletingAccount 
                      ? t(language, 'accountDestructionAuth') 
                      : t(language, 'bookDeletionVerification')
                  }
                </span>
              </h3>
              <button 
                onClick={() => {
                  setVerifyingProjectId(null);
                  setIsDeletingAccount(false);
                  setVerificationError(null);
                }}
                disabled={verificationLoading}
                className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-4 text-sm flex-1">
              
              {verificationError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg p-3 text-xs font-semibold">
                  {verificationError}
                </div>
              )}

              {passwordSetupMode ? (
                /* 1. SETUP / CREATE PASSWORD MODE */
                <div className="space-y-4">
                  <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-lg p-3 text-xs text-indigo-700 dark:text-indigo-300 leading-normal">
                    {t(language, 'securitySetupPref')}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                        {t(language, 'choosePassword')}
                      </label>
                      <input
                        type="password"
                        placeholder={t(language, 'minChars')}
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-zinc-900 dark:text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                        {t(language, 'confirmPassword')}
                      </label>
                      <input
                        type="password"
                        placeholder={t(language, 'confirmPasswordPlaceholder')}
                        value={confirmPasswordInput}
                        onChange={(e) => setConfirmPasswordInput(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-zinc-900 dark:text-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setVerifyingProjectId(null);
                        setIsDeletingAccount(false);
                      }}
                      className="flex-1 py-2 border border-zinc-200 dark:border-[#27272a] hover:bg-zinc-50 dark:hover:bg-[#18181b] rounded-lg text-xs font-semibold text-zinc-600 dark:text-zinc-400 transition-all cursor-pointer"
                    >
                      {t(language, 'cancel')}
                    </button>
                    <button
                      type="button"
                      onClick={saveNewPassword}
                      disabled={verificationLoading || passwordInput.length < 4}
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-400 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      {verificationLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        t(language, 'setSecurityPassword')
                      )}
                    </button>
                  </div>
                </div>
              ) : !isDeletingAccount ? (
                /* 2. BOOK DELETION VERIFICATION MODE */
                <div className="space-y-4">
                  <div className="bg-rose-500/5 border border-rose-500/10 rounded-lg p-3 text-xs text-rose-600 dark:text-rose-400 leading-normal">
                    {t(language, 'bookDeletionWarn', { name: verifyingProjectName })}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest block mb-1 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-zinc-500" />
                      {t(language, 'verificationPassword')}
                    </label>
                    <input
                      type="password"
                      placeholder={t(language, 'enterSecurityPasswordPlaceholder')}
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-zinc-900 dark:text-white"
                      autoFocus
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setVerifyingProjectId(null)}
                      className="flex-1 py-2 border border-zinc-200 dark:border-[#27272a] hover:bg-zinc-50 dark:hover:bg-[#18181b] rounded-lg text-xs font-semibold text-zinc-600 dark:text-zinc-400 transition-all cursor-pointer"
                    >
                      {t(language, 'cancel')}
                    </button>
                    <button
                      type="button"
                      onClick={confirmBookDeletion}
                      disabled={verificationLoading || !passwordInput.trim()}
                      className="flex-1 py-2 bg-red-600 hover:bg-red-500 disabled:bg-zinc-400 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                    >
                      {verificationLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          {t(language, 'erasing')}
                        </>
                      ) : (
                        t(language, 'confirmDeletion')
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                /* 3. ACCOUNT DELETION VERIFICATION MODE (EMAIL, PASSWORD, DOUBLE CONFIRM CHECKBOX, PATTERN FIELD) */
                <div className="space-y-4">
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 text-xs text-rose-600 dark:text-rose-400 space-y-1">
                    <h4 className="font-bold flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {t(language, 'criticalDestructiveAction')}
                    </h4>
                    <p className="leading-normal">
                      {t(language, 'accountDeletionWarn')}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                        {t(language, 'accountEmailAddress')}
                      </label>
                      <p className="text-[11px] text-zinc-500 mb-1">
                        {t(language, 'mustMatchActiveSession', { email: user?.email || "guest" })}
                      </p>
                      <input
                        type="email"
                        placeholder={t(language, 'verifyEmailPlaceholder')}
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 text-zinc-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                        {t(language, 'verificationPassword')}
                      </label>
                      <input
                        type="password"
                        placeholder={t(language, 'enterSecurityPasswordPlaceholder')}
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 text-zinc-900 dark:text-white"
                      />
                    </div>

                    {/* Checkbox Double Confirm */}
                    <label className="flex items-start gap-2.5 bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] rounded-lg p-3 cursor-pointer group hover:border-red-500/40 transition-colors">
                      <input 
                        type="checkbox"
                        checked={doubleConfirmChecked}
                        onChange={(e) => setDoubleConfirmChecked(e.target.checked)}
                        className="mt-0.5 rounded border-zinc-300 text-red-600 focus:ring-red-500 w-4 h-4 cursor-pointer"
                      />
                      <span className="text-xs text-zinc-600 dark:text-zinc-300 leading-snug font-medium select-none">
                        {t(language, 'doubleConfirmCheckboxLabel')}
                      </span>
                    </label>

                    {/* Word confirmation input */}
                    <div>
                      <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                        {t(language, 'authorizationWord')}
                      </label>
                      <p className="text-[11px] text-zinc-500 mb-1">
                        {t(language, 'typeDeleteToAuthorize')}
                      </p>
                      <input
                        type="text"
                        placeholder="DELETE"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        className="w-full font-mono text-center font-bold tracking-widest bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 text-zinc-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsDeletingAccount(false)}
                      className="flex-1 py-2 border border-zinc-200 dark:border-[#27272a] hover:bg-zinc-50 dark:hover:bg-[#18181b] rounded-lg text-xs font-semibold text-zinc-600 dark:text-zinc-400 transition-all cursor-pointer"
                    >
                      {t(language, 'cancel')}
                    </button>
                    <button
                      type="button"
                      onClick={handleAccountDeletion}
                      disabled={verificationLoading || !emailInput.trim() || !passwordInput.trim() || !doubleConfirmChecked || confirmText.toLowerCase() !== "delete"}
                      className="flex-1 py-2 bg-red-600 hover:bg-red-500 disabled:bg-zinc-400 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                    >
                      {verificationLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          {t(language, 'purgingData')}
                        </>
                      ) : (
                        t(language, 'permanentlyDeleteAccount')
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
