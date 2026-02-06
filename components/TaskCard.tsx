
import React from 'react';
import { Trash2, Edit, CheckCircle, Clock, Link as LinkIcon, Paperclip, User as UserIcon } from 'lucide-react';
import { Task, Priority } from '../types';
import { translations } from '../translations';

interface TaskCardProps {
  task: Task;
  lang: 'bn' | 'en';
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, lang, onToggle, onDelete, onEdit }) => {
  const t = translations[lang];
  
  const priorityColors = {
    [Priority.HIGH]: 'bg-red-100 text-red-600',
    [Priority.MEDIUM]: 'bg-orange-100 text-orange-600',
    [Priority.LOW]: 'bg-green-100 text-green-600',
  };

  const priorityLabels = {
    [Priority.HIGH]: t.high,
    [Priority.MEDIUM]: t.medium,
    [Priority.LOW]: t.low,
  };

  return (
    <div className={`glass rounded-2xl p-5 custom-shadow transition-all group border-l-8 ${task.completed ? 'border-gray-400 opacity-80' : 
      task.priority === Priority.HIGH ? 'border-red-500' : 
      task.priority === Priority.MEDIUM ? 'border-orange-500' : 'border-green-500'}`}>
      
      <div className="flex justify-between items-start mb-3">
        <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${priorityColors[task.priority]}`}>
          {priorityLabels[task.priority]}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"><Edit size={16} /></button>
          <button onClick={onDelete} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
        </div>
      </div>

      <h3 className={`text-xl font-bold text-gray-800 mb-2 ${task.completed ? 'line-through text-gray-400' : ''}`}>
        {task.title}
      </h3>
      
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
        {task.description}
      </p>

      <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-4 items-center">
        <div className="flex items-center gap-1.5">
          <Clock size={14} />
          <span>{task.deadline}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <UserIcon size={14} />
          <span>{t.assignee}: {task.assignedTo}</span>
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
        <div className="flex items-center gap-3">
          {task.docLink && (
            <a href={task.docLink} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 transition-colors">
              <LinkIcon size={18} />
            </a>
          )}
          {task.file && (
            <div title="ফাইল অ্যাটাচ করা হয়েছে" className="text-green-600">
              <Paperclip size={18} />
            </div>
          )}
        </div>
        <button 
          onClick={onToggle}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            task.completed 
            ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' 
            : 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700 active:scale-95'
          }`}
        >
          {task.completed ? t.openAgain : t.complete}
          {!task.completed && <CheckCircle size={16} />}
        </button>
      </div>
    </div>
  );
};

export default TaskCard;
