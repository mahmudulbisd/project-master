
import React, { useState } from 'react';
import { X, Send, Mail, UserPlus } from 'lucide-react';
import { translations } from '../translations';

interface InviteModalProps {
  isOpen: boolean;
  lang: 'bn' | 'en';
  onClose: () => void;
  onInvite: (email: string) => void;
}

const InviteModal: React.FC<InviteModalProps> = ({ isOpen, lang, onClose, onInvite }) => {
  const t = translations[lang];
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    onInvite(email);
    setEmail('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <UserPlus />
            {t.inviteUser}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <Mail size={16} /> {t.emailAddress}
            </label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            <Send size={20} />
            {t.sendInvite}
          </button>
        </form>
      </div>
    </div>
  );
};

export default InviteModal;
