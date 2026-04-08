import React, { useState } from 'react';
import { Modal } from '../Modal';
import { format } from 'date-fns';
import { useAppMutations } from '../../hooks/useQueries';

export function SalarioModal({ isOpen, onClose, setToast, setError, pessoas }: any) {
  const [newSalario, setNewSalario] = useState({ 
    data_pagamento: format(new Date(), 'yyyy-MM-dd'), 
    valor: '', 
    descricao: '', 
    recebedor_id: '' 
  });

  const { createSalario } = useAppMutations();

  const handleAddSalario = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const valorNum = parseFloat(newSalario.valor.replace(',', '.'));
    const recebedorIdNum = parseInt(newSalario.recebedor_id);

    if (isNaN(valorNum) || isNaN(recebedorIdNum)) {
      setError('Por favor, preencha todos os campos obrigatórios com valores válidos.');
      return;
    }

    try {
      await createSalario.mutateAsync({ 
        ...newSalario, 
        valor: valorNum, 
        recebedor_id: recebedorIdNum 
      });

      setNewSalario({ 
        data_pagamento: format(new Date(), 'yyyy-MM-dd'), 
        valor: '', 
        descricao: '', 
        recebedor_id: '' 
      });
      onClose();
      setToast('Entrada adicionada com sucesso!');
    } catch (err: any) {
      setError(err.message || 'Erro ao adicionar entrada. Verifique os campos.');
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Adicionar Entrada"
      className="w-[90%] h-[90%] sm:w-[90%] sm:h-[90%]"
    >
      <form onSubmit={handleAddSalario} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Data do Pagamento</label>
            <input 
              type="date" 
              required
              value={newSalario.data_pagamento}
              onChange={e => setNewSalario(prev => ({ ...prev, data_pagamento: e.target.value }))}
              className="mt-1 w-full rounded-xl border-gray-200 bg-gray-50 p-3 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Valor (R$)</label>
            <input 
              type="number" 
              step="0.01"
              required
              value={newSalario.valor}
              onChange={e => setNewSalario(prev => ({ ...prev, valor: e.target.value }))}
              className="mt-1 w-full rounded-xl border-gray-200 bg-gray-50 p-3 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Descrição</label>
          <input 
            type="text" 
            value={newSalario.descricao}
            onChange={e => setNewSalario(prev => ({ ...prev, descricao: e.target.value }))}
            placeholder="Ex: Entrada Mensal, Bônus..."
            className="mt-1 w-full rounded-xl border-gray-200 bg-gray-50 p-3 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Recebedor</label>
          <select 
            required
            value={newSalario.recebedor_id}
            onChange={e => setNewSalario(prev => ({ ...prev, recebedor_id: e.target.value }))}
            className="mt-1 w-full rounded-xl border-gray-200 bg-gray-50 p-3 outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Selecione...</option>
            {pessoas.map((p: any) => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={createSalario.isPending} className="w-full rounded-xl bg-emerald-600 py-3 text-white font-bold shadow-soft hover:bg-emerald-700 hover:shadow-lg hover:scale-[1.02] transition-all active:scale-[0.98]">
          {createSalario.isPending ? 'Salvando...' : 'Salvar'}
        </button>
      </form>
    </Modal>
  );
}
