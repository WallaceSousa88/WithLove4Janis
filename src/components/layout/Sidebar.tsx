import React from 'react';
import { Users, Tag, DollarSign, CreditCard, Plus, ClipboardCheck } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { PROMPT_CONTA_CORRENTE, PROMPT_CARTAO_CREDITO } from '../../constants/prompts';
import { copyToClipboard as copyToClipboardUtil } from '../../utils/clipboard';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const SidebarButton = ({ onClick, icon, label, color, hoverBg }: any) => (
  <button 
    type="button"
    onClick={onClick} 
    className={cn(
      "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all active:scale-[0.98] hover:shadow-sm hover:scale-[1.01]",
      color,
      hoverBg
    )}
  >
    {icon}
    <span>{label}</span>
  </button>
);

interface SidebarProps {
  onOpenPessoaModal: () => void;
  onOpenCategoriaModal: () => void;
  onOpenSalarioModal: () => void;
  onOpenDespesaModal: () => void;
  onOpenImportModal: () => void;
  setToast: (msg: string | null) => void;
  setError: (msg: string | null) => void;
}

export function Sidebar({
  onOpenPessoaModal,
  onOpenCategoriaModal,
  onOpenSalarioModal,
  onOpenDespesaModal,
  onOpenImportModal,
  setToast,
  setError
}: SidebarProps) {

  const handleCopy = async (text: string, message: string) => {
    const success = await copyToClipboardUtil(text);
    if (success) {
      setToast(message);
    } else {
      setError('Não foi possível copiar o texto automaticamente. Por favor, tente selecionar e copiar manualmente.');
    }
  };

  return (
    <aside className="w-72 bg-white border-r border-gray-200 fixed h-full overflow-y-auto z-30 shadow-sm custom-scrollbar">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-indigo-600 p-2 rounded-xl text-white">
            <DollarSign size={24} />
          </div>
          <h1 className="text-xl font-bold text-gray-800 tracking-tight">WithLove4Janis</h1>
        </div>
        
        <nav className="space-y-1">
          <SidebarButton 
            onClick={onOpenPessoaModal} 
            icon={<Users size={20} />} 
            label="Gerenciar Pessoas" 
            color="text-indigo-600"
            hoverBg="hover:bg-indigo-100"
          />
          <SidebarButton 
            onClick={onOpenCategoriaModal} 
            icon={<Tag size={20} />} 
            label="Gerenciar Categoria" 
            color="text-amber-600"
            hoverBg="hover:bg-amber-100"
          />
          <SidebarButton 
            onClick={onOpenSalarioModal} 
            icon={<DollarSign size={20} />} 
            label="Adicionar Entrada" 
            color="text-emerald-600"
            hoverBg="hover:bg-emerald-100"
          />
          <SidebarButton 
            onClick={onOpenDespesaModal} 
            icon={<CreditCard size={20} />} 
            label="Adicionar Despesa" 
            color="text-rose-600"
            hoverBg="hover:bg-rose-100"
          />
          <SidebarButton 
            onClick={onOpenImportModal} 
            icon={<Plus size={20} />} 
            label="Importar CSV" 
            color="text-blue-600"
            hoverBg="hover:bg-blue-100"
          />
          
          <div className="pt-6 pb-2">
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Prompts Itau</p>
          </div>
          
          <SidebarButton 
            onClick={() => handleCopy(PROMPT_CONTA_CORRENTE, 'Prompt Conta Corrente copiado!')} 
            icon={<ClipboardCheck size={20} />} 
            label="Prompt Conta Corrente" 
            color="text-purple-600"
            hoverBg="hover:bg-purple-100"
          />
          <SidebarButton 
            onClick={() => handleCopy(PROMPT_CARTAO_CREDITO, 'Prompt Cartão de Crédito copiado!')} 
            icon={<ClipboardCheck size={20} />} 
            label="Prompt Cartao Credito" 
            color="text-pink-600"
            hoverBg="hover:bg-pink-100"
          />
        </nav>
      </div>
    </aside>
  );
}
