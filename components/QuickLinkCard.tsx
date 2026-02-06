
import React from 'react';
import { ExternalLink, Trash2, Info } from 'lucide-react';
import { QuickLink } from '../types';

interface QuickLinkCardProps {
  link: QuickLink;
  onDelete: (id: string) => void;
}

const QuickLinkCard: React.FC<QuickLinkCardProps> = ({ link, onDelete }) => {
  return (
    <div className="group flex flex-col p-4 bg-white hover:bg-indigo-50 rounded-2xl border border-gray-100 transition-all hover:shadow-md hover:-translate-y-1 h-full shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <a 
          href={link.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-3 text-sm font-bold text-gray-800 truncate flex-1"
        >
          <div className="bg-indigo-100 p-2.5 rounded-xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
            <ExternalLink size={16} />
          </div>
          <span className="truncate" title={link.title}>{link.title}</span>
        </a>
        <button 
          onClick={() => onDelete(link.id)}
          className="text-gray-300 hover:text-red-500 p-1.5 transition-colors opacity-0 group-hover:opacity-100 bg-gray-50 rounded-lg ml-2"
        >
          <Trash2 size={16} />
        </button>
      </div>
      {link.description && (
        <div className="mt-auto pt-2 flex items-start gap-1.5 text-xs text-gray-500 border-t border-gray-50">
          <Info size={12} className="mt-0.5 flex-shrink-0 text-indigo-300" />
          <span className="line-clamp-2 italic leading-relaxed">{link.description}</span>
        </div>
      )}
    </div>
  );
};

export default QuickLinkCard;
