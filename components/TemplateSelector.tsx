
import React from 'react';
import type { TemplateId } from '../types';

interface TemplateSelectorProps {
  selectedTemplate: TemplateId;
  onSelectTemplate: (template: TemplateId) => void;
}

const templates: { id: TemplateId; name: string; }[] = [
  { id: 'classic', name: 'Classic' },
  { id: 'modern', name: 'Modern' },
  { id: 'bold', name: 'Bold' },
  { id: 'minimalist', name: 'Minimal' },
  { id: 'professional', name: 'Pro' },
  { id: 'elegant', name: 'Elegant' },
  { id: 'tech', name: 'Tech' },
];

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({ selectedTemplate, onSelectTemplate }) => {
  return (
    <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar max-w-full">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1 hidden lg:block whitespace-nowrap">Template:</span>
      <div className="flex p-0.5 rounded-lg gap-1">
        {templates.map(template => (
            <button
              key={template.id}
              onClick={() => onSelectTemplate(template.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
                  selectedTemplate === template.id 
                  ? 'bg-teal-50 text-teal-700 border-teal-200 shadow-sm' 
                  : 'bg-transparent text-slate-500 border-transparent hover:bg-slate-100 hover:text-slate-700'
              }`}
            >
              {template.name}
            </button>
        ))}
      </div>
    </div>
  );
};
