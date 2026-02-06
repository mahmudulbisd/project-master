
import React, { useState } from 'react';
import { X, Save, Link as LinkIcon, FileText, Type } from 'lucide-react';
import { translations } from '../translations';
import { QuickLink } from '../types';

interface QuickLinkModalProps {
  isOpen: boolean;
  lang: 'bn' | 'en';
  onClose: () => void;
  onSubmit: (link: Omit<QuickLink, 'id'>) => void;
}

const QuickLinkModal: React.FC<QuickLinkModalProps> = ({ isOpen, lang, onClose, onSubmit }) => {
  const t = translations[lang];
  const [formData, setFormData] = useState({ title: '', url: '', description: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.url) return;
    onSubmit(formData);
    setFormData({ title: '', url: '', description: '' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <LinkIcon />
            {t.newLink}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <Type size={16} /> {t.linkTitle}
            </label>
            <input
              required
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <LinkIcon size={16} /> {t.linkUrl}
            </label>
            <input
              required
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <FileText size={16} /> {t.linkDesc}
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            <Save size={20} />
            {t.save}
          </button>
        </form>
      </div>
    </div>
  );
};

export default QuickLinkModal;
