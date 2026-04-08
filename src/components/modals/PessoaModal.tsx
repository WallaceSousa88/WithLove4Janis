import React, { useState, useEffect } from 'react';
import { Modal } from '../Modal';
import { PALETTES } from '../../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAppMutations } from '../../hooks/useQueries';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function PessoaModal({ isOpen, onClose, setToast, setError, pessoas }: any) {
  const [newPessoa, setNewPessoa] = useState({ nome: '', cor: '' });
  const { createPessoa } = useAppMutations();

  const getNextAvailableColor = () => {
    const usedColors = pessoas.map((p: any) => p.cor);
    for (const palette of PALETTES) {
      for (const color of palette.colors) {
        if (!usedColors.includes(color)) return color;
      }
    }
    return PALETTES[0].colors[0];
  };

  useEffect(() => {
    if (isOpen && !newPessoa.cor) {
      setNewPessoa(prev => ({ ...prev, cor: getNextAvailableColor() }));
    }
  }, [isOpen, newPessoa.cor]);

  const handleAddPessoa = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPessoa.mutateAsync(newPessoa);
      setNewPessoa({ nome: '', cor: '' });
      onClose();
      setToast('Pessoa adicionada com sucesso!');
    } catch (err) {
      setError('Erro ao adicionar pessoa. Verifique os dados e tente novamente.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gerenciar Pessoas">
      <form onSubmit={handleAddPessoa} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nome</label>
          <input 
            type="text" 
            required
            value={newPessoa.nome}
            onChange={e => setNewPessoa(prev => ({ ...prev, nome: e.target.value }))}
            className="mt-1 w-full rounded-xl border-gray-200 bg-gray-50 p-3 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Cor</label>
          <div className="mt-2 grid grid-cols-5 gap-2">
            {PALETTES.flatMap(p => p.colors).map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setNewPessoa(prev => ({ ...prev, cor: c }))}
                className={cn(
                  "h-8 w-8 rounded-full border-2 transition-transform hover:scale-110",
                  newPessoa.cor === c ? "border-gray-900 scale-110" : "border-transparent"
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
        <button type="submit" disabled={createPessoa.isPending} className="w-full rounded-xl bg-indigo-600 py-3 text-white font-bold shadow-soft hover:bg-indigo-700 hover:shadow-lg hover:scale-[1.02] transition-all active:scale-[0.98]">
          {createPessoa.isPending ? 'Salvando...' : 'Salvar'}
        </button>
      </form>
    </Modal>
  );
}
