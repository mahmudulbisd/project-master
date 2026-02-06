
import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle, Trash2, LogOut, LayoutDashboard, Globe, ShieldCheck, Users, ReceiptText, Link as LinkIcon, User as UserIcon, Mail, Lock, AlertCircle } from 'lucide-react';
import { Task, Category, Priority, User, QuickLink, Invoice, Client } from './types';
import { translations } from './translations';
import TaskModal from './components/TaskModal';
import QuickLinkCard from './components/QuickLinkCard';
import TaskCard from './components/TaskCard';
import InviteModal from './components/InviteModal';
import InvoiceModal from './components/InvoiceModal';
import InvoiceCard from './components/InvoiceCard';
import QuickLinkModal from './components/QuickLinkModal';
import InvoicePrintView from './components/InvoicePrintView';

const API_BASE = '/api';

const App: React.FC = () => {
  const [lang, setLang] = useState<'bn' | 'en'>('bn');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [links, setLinks] = useState<QuickLink[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [token, setToken] = useState<string | null>(localStorage.getItem('pm_token'));
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loginData, setLoginData] = useState({ email: '', password: '', name: '' });

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isQuickLinkModalOpen, setIsQuickLinkModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [printingInvoice, setPrintingInvoice] = useState<Invoice | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category | 'COMPLETED' | 'ALL' | 'INVOICES'>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const t = translations[lang];

  const apiCall = async (endpoint: string, method: string = 'GET', body: any = null) => {
    try {
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['x-auth-token'] = token;
      
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : null
      });

      const text = await response.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (e) {
        // Not JSON
      }
      
      if (response.status === 401) {
        handleLogout();
        return null;
      }

      if (!response.ok) {
        const errorDetail = data?.detail || data?.msg || `Status ${response.status}`;
        throw new Error(errorDetail);
      }
      
      return data;
    } catch (error: any) {
      console.error("API Call Error:", error);
      throw error;
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('pm_user');
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
        fetchData();
      } catch (e) {
        handleLogout();
      }
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [tasksData, invoicesData, linksData, usersData] = await Promise.all([
        apiCall('/tasks').catch(() => []),
        apiCall('/invoices').catch(() => []),
        apiCall('/quicklinks').catch(() => []),
        apiCall('/users').catch(() => [])
      ]);
      setTasks(tasksData || []);
      setInvoices(invoicesData || []);
      setLinks(linksData || []);
      setAllUsers(usersData || []);
    } catch (e) {
      console.error("Fetch Data Failed", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      setAuthLoading(true);
      const data = await apiCall('/auth/login', 'POST', { email: loginData.email, password: loginData.password });
      if (data) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('pm_token', data.token);
        localStorage.setItem('pm_user', JSON.stringify(data.user));
      }
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      setAuthLoading(true);
      const data = await apiCall('/auth/register', 'POST', loginData);
      if (data) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('pm_token', data.token);
        localStorage.setItem('pm_user', JSON.stringify(data.user));
      }
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('pm_token');
    localStorage.removeItem('pm_user');
  };

  if (isLoading && token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-white">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mb-4"></div>
        <p className="animate-pulse">লোড হচ্ছে, দয়া করে অপেক্ষা করুন...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md animate-in slide-in-from-bottom-4 duration-500">
          <div className="text-center mb-8">
            <div className="bg-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg">
              <LayoutDashboard size={32} />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">{t.appName}</h1>
            <p className="text-gray-500">{t.loginPrompt}</p>
          </div>
          
          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-xl flex items-start gap-3 animate-bounce">
              <AlertCircle className="text-red-500 shrink-0" size={20} />
              <div className="text-sm text-red-700 font-medium">{errorMsg}</div>
            </div>
          )}
          
          <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
            {isRegistering && (
              <div className="relative">
                <UserIcon className="absolute left-4 top-3.5 text-gray-400" size={18} />
                <input required type="text" placeholder="পূর্ণ নাম" value={loginData.name} onChange={e => setLoginData({...loginData, name: e.target.value})}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none" />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 text-gray-400" size={18} />
              <input required type="email" placeholder="ইমেইল অ্যাড্রেস" value={loginData.email} onChange={e => setLoginData({...loginData, email: e.target.value})}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none" />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-gray-400" size={18} />
              <input required type="password" placeholder="পাসওয়ার্ড" value={loginData.password} onChange={e => setLoginData({...loginData, password: e.target.value})}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none" />
            </div>
            
            <button type="submit" disabled={authLoading}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all transform active:scale-95 flex items-center justify-center gap-2">
              {authLoading ? <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (isRegistering ? 'রেজিস্ট্রেশন করুন' : 'লগইন করুন')}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <button onClick={() => { setIsRegistering(!isRegistering); setErrorMsg(null); }} className="text-indigo-600 font-bold hover:underline text-sm">
              {isRegistering ? 'আগে থেকেই একাউন্ট আছে? লগইন করুন' : 'নতুন একাউন্ট খুলতে চান? রেজিস্ট্রেশন করুন'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard logic continues...
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 no-print">
      <header className="glass rounded-2xl p-6 mb-8 flex flex-wrap justify-between items-center gap-4 custom-shadow">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <LayoutDashboard size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{t.appName}</h1>
            <p className="text-sm text-gray-500">{t.appSubName}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')} className="flex items-center gap-2 px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg font-bold">
            <Globe size={18} /> {lang === 'bn' ? 'English' : 'বাংলা'}
          </button>
          <div className="hidden md:flex flex-col items-end mr-2">
            <span className="font-semibold text-gray-700 flex items-center gap-1">
              {user.name} {user.role === 'admin' && <ShieldCheck size={14} className="text-indigo-600" />}
            </span>
            <span className="text-xs text-gray-500">{user.email}</span>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
        <aside className="lg:col-span-1 space-y-4">
          <div className="glass rounded-2xl p-4 custom-shadow">
            <h2 className="text-lg font-bold mb-4 px-2 text-indigo-800">{t.categories}</h2>
            <nav className="space-y-1">
              {[
                { label: t.allTasks, value: 'ALL', icon: '📌' },
                { label: t.today, value: Category.TODAY, icon: '📅' },
                { label: t.tomorrow, value: Category.TOMORROW, icon: '👍' },
                { label: t.upcoming, value: Category.UPCOMING, icon: '🗓️' },
                { label: t.thisWeek, value: Category.THIS_WEEK, icon: '🏋️' },
                { label: t.lifeStuff, value: Category.LIFE_STUFF, icon: '🌟' },
                { label: t.completedTasks, value: 'COMPLETED', icon: '✅' },
                { label: t.invoices, value: 'INVOICES', icon: '🧾' },
              ].map((item) => (
                <button key={item.value} onClick={() => setActiveCategory(item.value as any)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between ${activeCategory === item.value ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-indigo-50'}`}>
                  <span className="flex items-center gap-3">
                    <span className="text-lg">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </span>
                </button>
              ))}
            </nav>
          </div>
          
          <div className="glass rounded-2xl p-6 custom-shadow">
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-indigo-800">{t.quickLinks}</h2>
                <button onClick={() => setIsQuickLinkModalOpen(true)} className="p-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200"><Plus size={18} /></button>
             </div>
             <div className="space-y-3">
               {links.map(link => (
                 <QuickLinkCard key={link._id || link.id} link={link} onDelete={async (id) => {
                   await apiCall(`/quicklinks/${id}`, 'DELETE');
                   setLinks(links.filter(l => (l._id || l.id) !== id));
                 }} />
               ))}
               {links.length === 0 && <p className="text-sm text-gray-400 italic text-center py-4">{t.noLinks}</p>}
             </div>
          </div>
        </aside>

        <main className="lg:col-span-3 space-y-6">
          <div className="flex justify-between items-center bg-white/30 backdrop-blur p-4 rounded-2xl border border-white/20">
            <h2 className="text-xl font-bold text-white drop-shadow-md">
              {activeCategory === 'ALL' ? t.allTasks : 
               activeCategory === 'COMPLETED' ? t.completedTasks : 
               activeCategory === 'INVOICES' ? t.invoices : activeCategory}
            </h2>
            <button 
              onClick={() => activeCategory === 'INVOICES' ? setIsInvoiceModalOpen(true) : setIsTaskModalOpen(true)}
              className="bg-white text-indigo-700 px-6 py-2 rounded-xl font-bold shadow-lg hover:scale-105 transition-all flex items-center gap-2"
            >
              <Plus size={20} /> {activeCategory === 'INVOICES' ? t.newInvoice : t.newTask}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeCategory === 'INVOICES' ? (
              invoices.map(inv => (
                <InvoiceCard key={inv._id || inv.id} invoice={inv} lang={lang} 
                  onDelete={async () => {
                    await apiCall(`/invoices/${inv._id || inv.id}`, 'DELETE');
                    setInvoices(invoices.filter(i => (i._id || i.id) !== (inv._id || inv.id)));
                  }}
                  onEdit={() => { setEditingInvoice(inv); setIsInvoiceModalOpen(true); }}
                  onPrint={() => { setPrintingInvoice(inv); window.print(); }}
                />
              ))
            ) : (
              tasks
                .filter(t => {
                  if (activeCategory === 'ALL') return !t.completed;
                  if (activeCategory === 'COMPLETED') return t.completed;
                  return t.category === activeCategory && !t.completed;
                })
                .map(task => (
                  <TaskCard key={task._id || task.id} task={task} lang={lang}
                    onToggle={async () => {
                      const updated = await apiCall(`/tasks/${task._id || task.id}`, 'PUT', { completed: !task.completed });
                      setTasks(tasks.map(ts => (ts._id || ts.id) === (task._id || task.id) ? updated : ts));
                    }}
                    onDelete={async () => {
                      await apiCall(`/tasks/${task._id || task.id}`, 'DELETE');
                      setTasks(tasks.filter(ts => (ts._id || ts.id) !== (task._id || task.id)));
                    }}
                    onEdit={() => { setEditingTask(task); setIsTaskModalOpen(true); }}
                  />
                ))
            )}
            
            {((activeCategory !== 'INVOICES' && tasks.length === 0) || (activeCategory === 'INVOICES' && invoices.length === 0)) && (
               <div className="col-span-full py-20 text-center">
                  <div className="bg-white/20 inline-block p-6 rounded-full mb-4 text-white">
                    <CheckCircle size={48} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">{t.noTasks}</h3>
                  <p className="text-white/70">{t.restPrompt}</p>
               </div>
            )}
          </div>
        </main>
      </div>

      <TaskModal 
        isOpen={isTaskModalOpen} lang={lang} users={allUsers} initialData={editingTask}
        onClose={() => { setIsTaskModalOpen(false); setEditingTask(null); }}
        onSubmit={async (data) => {
          if (editingTask) {
            const res = await apiCall(`/tasks/${editingTask._id || editingTask.id}`, 'PUT', data);
            setTasks(tasks.map(t => (t._id || t.id) === (res._id || res.id) ? res : t));
          } else {
            const res = await apiCall('/tasks', 'POST', data);
            setTasks([res, ...tasks]);
          }
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
      />

      <QuickLinkModal 
        isOpen={isQuickLinkModalOpen} lang={lang}
        onClose={() => setIsQuickLinkModalOpen(false)}
        onSubmit={async (data) => {
          const res = await apiCall('/quicklinks', 'POST', data);
          setLinks([...links, res]);
          setIsQuickLinkModalOpen(false);
        }}
      />

      {printingInvoice && <div className="print-only"><InvoicePrintView invoice={printingInvoice} lang={lang} /></div>}
    </div>
  );
};

export default App;
