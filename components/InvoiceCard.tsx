
import React from 'react';
import { Trash2, Edit, Calendar, User, Receipt, Download } from 'lucide-react';
import { Invoice } from '../types';
import { translations } from '../translations';

interface InvoiceCardProps {
  invoice: Invoice;
  lang: 'bn' | 'en';
  onDelete: () => void;
  onEdit: () => void;
  onPrint: () => void;
}

const InvoiceCard: React.FC<InvoiceCardProps> = ({ invoice, lang, onDelete, onEdit, onPrint }) => {
  const t = translations[lang];

  return (
    <div className="glass rounded-2xl p-6 custom-shadow group border-l-8 border-indigo-500 hover:translate-y-[-2px] transition-all">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800">{invoice.invoiceNumber}</h3>
          <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider">
            {invoice.status === 'paid' ? t.paid : t.unpaid}
          </p>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onPrint} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg" title={t.downloadPdf}>
            <Download size={16} />
          </button>
          <button onClick={onEdit} className="p-2 text-gray-500 hover:bg-indigo-50 rounded-lg"><Edit size={16} /></button>
          <button onClick={onDelete} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <User size={14} className="text-gray-400" />
          <span className="truncate"><strong>{t.billTo}:</strong> {invoice.billTo.split('\n')[0]}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar size={14} className="text-gray-400" />
          <span><strong>{t.date}:</strong> {invoice.date}</span>
        </div>
      </div>

      <div className="flex justify-between items-end border-t border-gray-100 pt-4">
        <div>
          <p className="text-xs text-gray-400 uppercase font-bold">{t.total}</p>
          <p className="text-2xl font-black text-indigo-700">{invoice.total.toFixed(2)}</p>
        </div>
        <div className="flex gap-2">
           <button onClick={onPrint} className="bg-indigo-100 text-indigo-700 p-3 rounded-xl hover:bg-indigo-200 transition-all md:hidden">
            <Download size={18} />
          </button>
          <button onClick={onEdit} className="bg-indigo-600 text-white p-3 rounded-xl shadow-lg hover:bg-indigo-700 transition-all">
            <Receipt size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceCard;
