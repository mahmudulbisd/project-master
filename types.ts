
export enum Priority {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low'
}

export enum Category {
  TODAY = 'Today',
  TOMORROW = 'Tomorrow',
  UPCOMING = 'Upcoming',
  THIS_WEEK = 'This Week',
  LIFE_STUFF = 'Life Stuff'
}

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  status: 'pending' | 'active';
}

export interface Client {
  id: string;
  _id?: string;
  name: string;
  email: string;
  address?: string;
}

export interface Task {
  id: string;
  _id?: string;
  title: string;
  description: string;
  deadline: string;
  priority: Priority;
  category: Category;
  completed: boolean;
  file?: string;
  docLink?: string;
  createdBy: string;
  assignedTo: string;
}

export interface QuickLink {
  id: string;
  _id?: string;
  title: string;
  url: string;
  description?: string;
}

export interface InvoiceItem {
  id: string;
  _id?: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Invoice {
  id: string;
  _id?: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  billFrom: string;
  billTo: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes: string;
  status: 'paid' | 'unpaid';
}
