
import React, { useState } from 'react';
import { X, Save, FileText, Calendar, AlertTriangle, List, User as UserIcon, Link as LinkIcon } from 'lucide-react';
import { Category, Priority, Task, User } from '../types';
import { translations } from '../translations';

interface TaskModalProps {
  isOpen: boolean;
  lang: 'bn' | 'en';
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: Task | null;
  users: User[];
}

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, lang, onClose, onSubmit, initialData, users }) => {
  const t = translations[lang];

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    deadline: initialData?.deadline || new Date().toISOString().split('T')[0],
    priority: initialData?.priority || Priority.MEDIUM,
    category: initialData?.category || Category.TODAY,
    assignedTo: users.find(u => u.name === initialData?.assignedTo)?.id || users[0]?.id || '',
    docLink: initialData?.docLink || '',
    file: initialData?.file || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return alert(lang === 'bn' ? 'দয়া করে শিরোনাম লিখুন' : 'Please enter a title');
    onSubmit({ ...initialData, ...formData });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            {initialData ? <FileText /> : <Calendar />}
            {initialData ? t.editTask : t.createTask}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[80vh] overflow-y-auto">
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-2">{t.taskName}</label>
            <input
              required
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder={t.taskNamePlaceholder}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-2">{t.description}</label>
            <textarea
              rows={3}
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none resize-none"
              placeholder={t.descPlaceholder}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <Calendar size={16} /> {t.deadline}
            </label>
            <input
              type="date"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <AlertTriangle size={16} /> {t.priority}
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none bg-white"
            >
              <option value={Priority.HIGH}>{t.high}</option>
              <option value={Priority.MEDIUM}>{t.medium}</option>
              <option value={Priority.LOW}>{t.low}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <List size={16} /> {t.category}
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none bg-white"
            >
              <option value={Category.TODAY}>{t.today}</option>
              <option value={Category.TOMORROW}>{t.tomorrow}</option>
              <option value={Category.UPCOMING}>{t.upcoming}</option>
              <option value={Category.THIS_WEEK}>{t.thisWeek}</option>
              <option value={Category.LIFE_STUFF}>{t.lifeStuff}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <UserIcon size={16} /> {t.assignTo}
            </label>
            <select
              name="assignedTo"
              value={formData.assignedTo}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none bg-white"
            >
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <LinkIcon size={16} /> {t.docLink}
            </label>
            <input
              type="url"
              name="docLink"
              value={formData.docLink}
              onChange={handleChange}
              placeholder="https://..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none"
            />
          </div>

          <div className="md:col-span-2 flex justify-end gap-3 mt-4">
            <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100">
              {t.cancel}
            </button>
            <button type="submit" className="px-10 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg flex items-center gap-2">
              <Save size={20} />
              {initialData ? t.update : t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
