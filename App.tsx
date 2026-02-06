
import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle, Trash2, LogOut, LayoutDashboard, Globe, ShieldCheck, Users, ReceiptText, Link as LinkIcon, User as UserIcon, Mail, Lock } from 'lucide-react';
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

// API Configuration
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
  const [loginData, setLoginData] = useState({ email: '', password: '', name: '' });

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isQuickLinkModalOpen, setIsQuickLinkModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [printingInvoice, setPrintingInvoice] = useState<Invoice | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category | 'COMPLETED' | 'ALL' | 'INVOICES'>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const t = translations[lang];

  // Improved API Wrapper with robust error handling
  const apiCall = async (endpoint: string, method: string = 'GET', body: any = null) => {
    try {
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['x-auth-token'] = token;
      
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : null
      });
      
      if (response.status === 401) {
        handleLogout();
        return null;
      }
      
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        if (!response.ok) throw new Error(data.msg || 'API Error');
        return data;
      } else {
        // If not JSON, it's likely a 504/500 HTML error from Vercel/Server
        if (response.status === 504 || response.status === 500) {
          throw new Error(lang === 'bn' 
            ? 'সার্ভার রেসপন্স করছে না। সম্ভবত MongoDB কানেক্ট করা হয়নি। Vercel-এ MONGO_URI চেক করুন।' 
            : 'Server not responding. MongoDB might not be connected. Please check MONGO_URI in Vercel.');
        }
        throw new Error(`Unexpected response: ${response.status}`);
      }
    } catch (error: any) {
      console.error("API Call failed:", error);
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
        apiCall('/tasks'),
        apiCall('/invoices'),
        apiCall('/quicklinks'),
        apiCall('/users')
      ]);
      setTasks(tasksData || []);
      setInvoices(invoicesData || []);
      setLinks(linksData || []);
      setAllUsers(usersData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAuthLoading(true);
      const data = await apiCall('/auth/login', 'POST', loginData);
      if (data) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('pm_token', data.token);
        localStorage.setItem('pm_user', JSON.stringify(data.user));
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
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
      alert(e.message);
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

  const handleAddTask = async (taskData: any) => {
    try {
      const newTask = await apiCall('/tasks', 'POST', taskData);
      setTasks([newTask, ...tasks]);
      setIsTaskModalOpen(false);
    } catch (e: any) { alert(e.message); }
  };

  const handleUpdateTask = async (taskData: any) => {
    try {
      const id = taskData._id || taskData.id;
      const updated = await apiCall(`/tasks/${id}`, 'PUT', taskData);
      setTasks(tasks.map(t => (t.id === updated.id || t._id === updated._id) ? updated : t));
      setIsTaskModalOpen(false);
    } catch (e: any) { alert(e.message); }
  };

  const handleAddQuickLink = async (linkData: Omit<QuickLink, 'id'>) => {
    try {
      const newLink = await apiCall('/quicklinks', 'POST', linkData);
      setLinks([newLink, ...links]);
      setIsQuickLinkModalOpen(false);
    } catch (e: any) { alert(e.message); }
  };

  const addOrUpdateInvoice = async (invoiceData: Invoice) => {
    try {
      if (editingInvoice) {
        const id = editingInvoice._id || editingInvoice.id;
        await apiCall(`/invoices/${id}`, 'PUT', invoiceData);
      } else {
        await apiCall('/invoices', 'POST', invoiceData);
      }
      fetchData();
      setIsInvoiceModalOpen(false);
      setEditingInvoice(null);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handlePrintInvoice = (invoice: Invoice) => {
    setPrintingInvoice(invoice);
    setTimeout(() => { window.print(); setPrintingInvoice(null); }, 200);
  };

  const filteredTasks = tasks.filter(task => {
    if (activeCategory === 'ALL') return !task.completed;
    if (activeCategory === 'COMPLETED') return task.completed;
    if (activeCategory === 'INVOICES') return false;
    return task.category === activeCategory && !task.completed;
  });

  if (isLoading && token) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
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
            <button onClick={() => setIsRegistering(!isRegistering)} className="text-indigo-600 font-bold hover:underline text-sm">
              {isRegistering ? 'আগে থেকেই একাউন্ট আছে? লগইন করুন' : 'নতুন একাউন্ট খুলতে চান? রেজিস্ট্রেশন করুন'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 no-print">
      <div className="print-only">
        {printingInvoice && <InvoicePrintView invoice={printingInvoice} lang={lang} />}
      </div>

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

          <div className="glass rounded-2xl p-4 custom-shadow">
            <h2 className="text-lg font-bold mb-4 px-2 text-indigo-800">{t.teamMembers}</h2>
            <div className="space-y-2">
              {allUsers.map(u => (
                <div key={u.id || u._id} className="flex items-center justify-between p-2 bg-white/50 rounded-lg text-sm">
                  <span className="truncate flex-1 font-medium">{u.name} {u.role === 'admin' && '⭐'}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${u.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                    {u.status === 'active' ? t.statusActive : t.statusPending}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main className="lg:col-span-3 space-y-6">
          <div className="flex justify-between items-center bg-white/40 p-4 rounded-2xl">
            <h2 className="text-2xl font-bold text-white drop-shadow-sm">
              {activeCategory === 'ALL' ? t.allTasks : activeCategory === 'COMPLETED' ? t.completedTasks : activeCategory === 'INVOICES' ? t.invoices : activeCategory}
            </h2>
            <button onClick={() => activeCategory === 'INVOICES' ? setIsInvoiceModalOpen(true) : setIsTaskModalOpen(true)}
              className="bg-white text-indigo-600 px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-indigo-50 transform active:scale-95 transition-all">
              <Plus size={20} /> {activeCategory === 'INVOICES' ? t.newInvoice : t.newTask}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeCategory === 'INVOICES' ? (
              invoices.map(invoice => (
                <InvoiceCard key={invoice.id || invoice._id} invoice={invoice} lang={lang} 
                  onDelete={async () => { await apiCall(`/invoices/${invoice._id || invoice.id}`, 'DELETE'); fetchData(); }}
                  onEdit={() => { setEditingInvoice(invoice); setIsInvoiceModalOpen(true); }}
                  onPrint={() => handlePrintInvoice(invoice)} />
              ))
            ) : filteredTasks.map(task => (
              <TaskCard key={task.id || task._id} task={task} lang={lang}
                onToggle={async () => { await apiCall(`/tasks/${task._id || task.id}`, 'PUT', { ...task, completed: !task.completed }); fetchData(); }}
                onDelete={async () => { await apiCall(`/tasks/${task._id || task.id}`, 'DELETE'); fetchData(); }}
                onEdit={() => { setEditingTask(task); setIsTaskModalOpen(true); }} />
            ))}
          </div>
        </main>
      </div>

      <section className="glass rounded-2xl p-6 custom-shadow mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-indigo-800 flex items-center gap-2"><LinkIcon size={20} /> {t.quickLinks}</h2>
          <button onClick={() => setIsQuickLinkModalOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-md">
            <Plus size={18} /> {t.newLink}
          </button>
        </div>
        <div className="flex overflow-x-auto pb-4 gap-4">
          {links.map(link => (
            <div key={link.id || link._id} className="flex-shrink-0 w-64">
              <QuickLinkCard link={link} onDelete={async (id) => { await apiCall(`/quicklinks/${id}`, 'DELETE'); fetchData(); }} />
            </div>
          ))}
        </div>
      </section>

      <TaskModal isOpen={isTaskModalOpen} lang={lang} users={allUsers} onClose={() => { setIsTaskModalOpen(false); setEditingTask(null); }}
        onSubmit={editingTask ? handleUpdateTask : handleAddTask} initialData={editingTask} />
      <InvoiceModal isOpen={isInvoiceModalOpen} lang={lang} user={user} clients={clients} onClose={() => { setIsInvoiceModalOpen(false); setEditingInvoice(null); }}
        onSubmit={addOrUpdateInvoice} onAddClient={c => setClients([...clients, c])} initialData={editingInvoice} />
      <QuickLinkModal isOpen={isQuickLinkModalOpen} lang={lang} onClose={() => setIsQuickLinkModalOpen(false)} onSubmit={handleAddQuickLink} />
    </div>
  );
};

export default App;
