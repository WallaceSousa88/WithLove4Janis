import React from 'react';
import { ChevronDown } from 'lucide-react';

interface PersonCardProps {
  person: any;
  formatCurrency: (val: number) => string;
  onClick: () => void;
}

export const PersonCard: React.FC<PersonCardProps> = ({ person, formatCurrency, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="rounded-2xl bg-white p-6 shadow-soft border-soft overflow-hidden relative cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all group shrink-0"
      style={{ '--hover-bg': `${person.cor}15` } as React.CSSProperties}
    >
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" 
        style={{ backgroundColor: `${person.cor}15` }}
      ></div>
      <div 
        className="absolute top-0 left-0 w-full h-2" 
        style={{ backgroundColor: person.cor }}
      ></div>
      
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold" style={{ color: person.cor }}>
          {person.nome}
        </h3>
        <div className="flex items-center gap-2">
          <ChevronDown size={18} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-500">Total Gasto:</span>
          <span className="font-bold text-rose-600">{formatCurrency(person.totalSpent)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500">Entrada Recebida:</span>
          <span className="font-bold text-emerald-600">{formatCurrency(person.totalSalary)}</span>
        </div>
      </div>
    </div>
  );
}
