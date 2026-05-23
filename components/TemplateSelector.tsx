
import React from 'react';
import type { TemplateId } from '../types';

interface TemplateSelectorProps {
  selectedTemplate: TemplateId;
  onSelectTemplate: (template: TemplateId) => void;
}

const templates: { id: TemplateId; name: string; icon: React.ReactNode }[] = [
  {
      id: 'classic',
      name: 'Classic',
      icon: (
          <div className="w-full h-full flex flex-col gap-0.5">
              <div className="w-full h-1.5 bg-current opacity-20"></div>
              <div className="flex gap-0.5">
                  <div className="w-2 h-2 bg-current opacity-40"></div>
                  <div className="flex-1 flex flex-col gap-0.5 pt-0.5">
                      <div className="w-full h-0.5 bg-current opacity-10"></div>
                      <div className="w-2/3 h-0.5 bg-current opacity-10"></div>
                  </div>
              </div>
          </div>
      )
  },
  {
      id: 'modern',
      name: 'Modern',
      icon: (
          <div className="w-full h-full flex flex-col gap-1">
              <div className="flex justify-between items-center">
                  <div className="w-3 h-3 rounded-full bg-current opacity-40"></div>
                  <div className="w-6 h-1 bg-current opacity-20"></div>
              </div>
              <div className="w-full h-4 border border-current border-dashed opacity-20 rounded-sm"></div>
          </div>
      )
  },
  {
      id: 'bold',
      name: 'Bold',
      icon: (
          <div className="w-full h-full flex flex-col gap-0">
              <div className="w-full h-3 bg-current opacity-40"></div>
              <div className="w-full h-4 bg-current opacity-10"></div>
          </div>
      )
  },
  {
      id: 'minimalist',
      name: 'Minimal',
      icon: (
          <div className="w-full h-full flex flex-col gap-1 pt-1">
              <div className="w-2/3 h-1 bg-current opacity-40"></div>
              <div className="w-full h-0.5 bg-current opacity-10"></div>
              <div className="w-full h-0.5 bg-current opacity-10"></div>
              <div className="w-full h-0.5 bg-current opacity-10"></div>
          </div>
      )
  },
  {
      id: 'professional',
      name: 'Pro',
      icon: (
          <div className="w-full h-full flex gap-1">
              <div className="w-3 h-full bg-current opacity-40"></div>
              <div className="flex-1 flex flex-col gap-1 pt-1">
                  <div className="w-full h-1 bg-current opacity-20"></div>
                  <div className="w-full h-0.5 bg-current opacity-10"></div>
                  <div className="w-full h-0.5 bg-current opacity-10"></div>
              </div>
          </div>
      )
  },
  {
      id: 'elegant',
      name: 'Elegant',
      icon: (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1">
              <div className="w-6 h-0.5 bg-current opacity-40"></div>
              <div className="w-4 h-4 rounded-full border-2 border-current opacity-20"></div>
              <div className="w-6 h-0.5 bg-current opacity-40"></div>
          </div>
      )
  },
  {
      id: 'tech',
      name: 'Tech',
      icon: (
          <div className="w-full h-full flex flex-col gap-1 overflow-hidden">
              <div className="w-full h-1 bg-current opacity-50 flex gap-0.5">
                  <div className="w-1 h-full bg-white/40"></div>
                  <div className="w-1 h-full bg-white/40"></div>
              </div>
              <div className="w-full h-4 bg-slate-900/10 rounded-sm p-0.5">
                  <div className="w-full h-full bg-current opacity-20"></div>
              </div>
          </div>
      )
  },
];

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({ selectedTemplate, onSelectTemplate }) => {
  return (
    <div className="flex items-center gap-4 overflow-x-auto hide-scrollbar max-w-full py-2" role="group" aria-label="Invoice Templates">
      <span id="template-selector-label" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1 hidden lg:block whitespace-nowrap">Style:</span>
      <div className="flex p-1 rounded-xl gap-3" role="list">
        {templates.map(template => (
            <button
              key={template.id}
              role="listitem"
              onClick={() => onSelectTemplate(template.id)}
              aria-pressed={selectedTemplate === template.id}
              aria-label={`Select ${template.name} template`}
              className={`flex flex-col items-center gap-2 transition-all group focus:outline-none`}
            >
              <div className={`w-12 h-14 sm:w-14 sm:h-16 rounded-lg border-2 p-1.5 transition-all shadow-sm flex items-center justify-center overflow-hidden
                  ${selectedTemplate === template.id
                    ? 'bg-teal-50 border-teal-600 shadow-md ring-2 ring-teal-100'
                    : 'bg-white border-slate-200 group-hover:border-teal-400 group-hover:shadow-md'
                  }`}
              >
                  <div className={`w-full h-full transition-colors ${selectedTemplate === template.id ? 'text-teal-600' : 'text-slate-300 group-hover:text-teal-400'}`}>
                      {template.icon}
                  </div>
              </div>
              <span className={`text-[10px] sm:text-xs font-bold transition-colors whitespace-nowrap px-2 py-0.5 rounded-full
                  ${selectedTemplate === template.id
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-500 group-hover:text-teal-700'
                  }`}
              >
                {template.name}
              </span>
            </button>
        ))}
      </div>
    </div>
  );
};
