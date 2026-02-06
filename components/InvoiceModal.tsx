
import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, Receipt, FileText, Edit3, UserPlus } from 'lucide-react';
import { Invoice, InvoiceItem, User, Client } from '../types';
import { translations } from '../translations';

interface InvoiceModalProps {
  isOpen: boolean;
  lang: 'bn' | 'en';
  user: User;
  clients: Client[];
  onClose: () => void;
  onSubmit: (invoice: Invoice) => void;
  onAddClient: (client: Client) => void;
  initialData?: Invoice | null;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, lang, user, clients, onClose, onSubmit, onAddClient, initialData }) => {
  const t = translations[lang];

  const [isEditingBillFrom, setIsEditingBillFrom] = useState(false);
  const [isAddingNewClient, setIsAddingNewClient] = useState(false);
  const [newClientData, setNewClientData] = useState({ name: '', email: '', address: '' });

  const defaultBillFrom = `${user.name}\n${user.email}`;

  const [formData, setFormData] = useState<Omit<Invoice, 'id' | 'subtotal' | 'taxAmount' | 'total'>>({
    invoiceNumber: initialData?.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
    date: initialData?.date || new Date().toISOString().split('T')[0],
    dueDate: initialData?.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    billFrom: initialData?.billFrom || defaultBillFrom,
    billTo: initialData?.billTo || '',
    items: initialData?.items || [{ id: '1', description: '', quantity: 1, rate: 0, amount: 0 }],
    taxRate: initialData?.taxRate || 0,
    notes: initialData?.notes || '',
    status: initialData?.status || 'unpaid'
  });

  const [totals, setTotals] = useState({ subtotal: 0, taxAmount: 0, total: 0 });

  useEffect(() => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = (subtotal * formData.taxRate) / 100;
    const total = subtotal + taxAmount;
    setTotals({ subtotal, taxAmount, total });
  }, [formData.items, formData.taxRate]);

  const handleItemChange = (id: string, field: keyof InvoiceItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'quantity' || field === 'rate') {
            updatedItem.amount = (updatedItem.quantity || 0) * (updatedItem.rate || 0);
          }
          return updatedItem;
        }
        return item;
      })
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { id: Math.random().toString(), description: '', quantity: 1, rate: 0, amount: 0 }]
    }));
  };

  const removeItem = (id: string) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }));
    }
  };

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientData.name) return;
    const client: Client = {
      id: Date.now().toString(),
      ...newClientData
    };
    onAddClient(client);
    setFormData(prev => ({ ...prev, billTo: `${client.name}\n${client.email}\n${client.address || ''}`.trim() }));
    setIsAddingNewClient(false);
    setNewClientData({ name: '', email: '', address: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalInvoice: Invoice = {
      ...formData,
      id: initialData?.id || Math.random().toString(36).substr(2, 9),
      ...totals
    };
    onSubmit(finalInvoice);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl my-8 animate-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white flex justify-between items-center sticky top-0 z-10">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Receipt />
            {initialData ? t.invoices : t.newInvoice}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">{t.invoiceNumber}</label>
              <input
                type="text"
                value={formData.invoiceNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">{t.date}</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">{t.dueDate}</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Bill From Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <FileText size={16} /> {t.billFrom}
                </label>
                <button 
                  type="button"
                  onClick={() => setIsEditingBillFrom(!isEditingBillFrom)}
                  className="text-indigo-600 hover:text-indigo-800 transition-colors p-1"
                  title={t.editBillFrom}
                >
                  <Edit3 size={16} />
                </button>
              </div>
              
              {isEditingBillFrom ? (
                <textarea
                  rows={3}
                  value={formData.billFrom}
                  onChange={(e) => setFormData(prev => ({ ...prev, billFrom: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-indigo-500 outline-none focus:ring-2 focus:ring-indigo-200 resize-none bg-indigo-50/30"
                />
              ) : (
                <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 text-gray-700 text-sm whitespace-pre-wrap min-h-[80px]">
                  {formData.billFrom}
                </div>
              )}
            </div>

            {/* Bill To Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <UserPlus size={16} /> {t.billTo}
                </label>
                <button 
                  type="button"
                  onClick={() => setIsAddingNewClient(!isAddingNewClient)}
                  className="text-indigo-600 hover:text-indigo-800 font-bold text-xs flex items-center gap-1"
                >
                  <Plus size={14} /> {t.addNewClient}
                </button>
              </div>

              {isAddingNewClient ? (
                <div className="p-4 rounded-xl border border-purple-200 bg-purple-50 space-y-3">
                  <input
                    type="text"
                    placeholder={t.clientName}
                    value={newClientData.name}
                    onChange={(e) => setNewClientData({...newClientData, name: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none"
                  />
                  <input
                    type="email"
                    placeholder={t.clientEmail}
                    value={newClientData.email}
                    onChange={(e) => setNewClientData({...newClientData, email: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none"
                  />
                  <textarea
                    placeholder={t.clientAddress}
                    value={newClientData.address}
                    onChange={(e) => setNewClientData({...newClientData, address: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none resize-none"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <button 
                      type="button" 
                      onClick={handleCreateClient}
                      className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-bold"
                    >
                      {t.addClient}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setIsAddingNewClient(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-bold text-gray-500"
                    >
                      {t.cancel}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <select
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none bg-white text-sm"
                    onChange={(e) => {
                      const client = clients.find(c => c.id === e.target.value);
                      if (client) {
                        setFormData(prev => ({ 
                          ...prev, 
                          billTo: `${client.name}\n${client.email}\n${client.address || ''}`.trim() 
                        }));
                      }
                    }}
                  >
                    <option value="">{t.selectClient}</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <textarea
                    rows={3}
                    value={formData.billTo}
                    onChange={(e) => setFormData(prev => ({ ...prev, billTo: e.target.value }))}
                    placeholder="Client Name, Address, Contact..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-indigo-500 resize-none text-sm"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="mb-8">
            <div className="bg-gray-50 p-4 rounded-t-2xl grid grid-cols-12 gap-4 text-sm font-bold text-gray-600">
              <div className="col-span-6">{t.items}</div>
              <div className="col-span-2">{t.quantity}</div>
              <div className="col-span-2">{t.rate}</div>
              <div className="col-span-2">{t.amount}</div>
            </div>
            <div className="border border-gray-100 rounded-b-2xl overflow-hidden">
              {formData.items.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-4 p-4 items-center border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  <div className="col-span-6 flex items-center gap-2">
                    <button type="button" onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                      placeholder="Item Description"
                      className="w-full bg-transparent outline-none text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value))}
                      className="w-full bg-transparent outline-none text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      value={item.rate}
                      onChange={(e) => handleItemChange(item.id, 'rate', parseFloat(e.target.value))}
                      className="w-full bg-transparent outline-none text-sm"
                    />
                  </div>
                  <div className="col-span-2 font-bold text-right">
                    {item.amount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addItem}
              className="mt-4 flex items-center gap-2 text-indigo-600 font-bold text-sm hover:underline"
            >
              <Plus size={16} /> {t.addItem}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">{t.notes}</label>
              <textarea
                rows={4}
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none resize-none"
              />
            </div>
            <div className="bg-indigo-50 p-6 rounded-2xl space-y-4">
              <div className="flex justify-between text-gray-600">
                <span>{t.subtotal}</span>
                <span className="font-bold">{totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span>{t.tax}</span>
                <input
                  type="number"
                  value={formData.taxRate}
                  onChange={(e) => setFormData(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                  className="w-20 px-2 py-1 rounded-lg border border-gray-200 text-right font-bold outline-none"
                />
              </div>
              <div className="flex justify-between text-indigo-800 text-xl font-bold border-t border-indigo-200 pt-4">
                <span>{t.total}</span>
                <span>{totals.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100">
              {t.cancel}
            </button>
            <button type="submit" className="px-10 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg flex items-center gap-2 transform active:scale-95 transition-all">
              <Save size={20} />
              {initialData ? t.update : t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceModal;
