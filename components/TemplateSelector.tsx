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
    <div className="flex items-center gap-3 overflow-x-auto pb-2 lg:pb-0 hide-scrollbar max-w-full">
      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 hidden lg:block whitespace-nowrap">Style:</span>
      <div className="flex bg-slate-100 p-1 rounded-lg">
        {templates.map(template => (
            <button
              key={template.id}
              onClick={() => onSelectTemplate(template.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${
                  selectedTemplate === template.id 
                  ? 'bg-white text-teal-700 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {template.name}
            </button>
        ))}
      </div>
    </div>
  );
};