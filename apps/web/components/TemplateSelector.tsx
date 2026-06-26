
import React from 'react';
import type { TemplateId } from '../types';

interface TemplateSelectorProps {
  selectedTemplate: TemplateId;
  onSelectTemplate: (template: TemplateId) => void;
}

const templates: { id: TemplateId; name: string }[] = [
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
    <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar max-w-full" role="group" aria-label="Invoice Templates">
      <span id="template-selector-label" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1 hidden lg:block whitespace-nowrap">Template:</span>
      <div className="flex p-0.5 rounded-lg gap-2" role="list">
        {templates.map(template => (
            <button
              key={template.id}
              role="listitem"
              onClick={() => onSelectTemplate(template.id)}
              aria-pressed={selectedTemplate === template.id}
              aria-label={`Select ${template.name} template`}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap border shadow-sm ${
                  selectedTemplate === template.id
                  ? 'bg-teal-600 text-white border-teal-600 shadow-md'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-teal-400 hover:text-teal-700'
              }`}
            >
              {template.name}
            </button>
        ))}
      </div>
    </div>
  );
};
