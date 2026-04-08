import React, { useState } from 'react';
import { Modal } from '../Modal';
import { format } from 'date-fns';
import { useAppMutations } from '../../hooks/useQueries';

export function DespesaModal({ isOpen, onClose, setToast, setError, pessoas, categorias }: any) {
  const [newDespesa, setNewDespesa] = useState({ 
    data_compra: format(new Date(), 'yyyy-MM-dd'), 
    data_pagamento: format(new Date(), 'yyyy-MM-dd'), 
    valor: '', 
    descricao: '', 
    origem_id: '', 
    destino: 'Dividir', 
    categoria_id: '' 
  });
  
  const { createDespesa } = useAppMutations();

  const handleAddDespesa = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const valorNum = parseFloat(newDespesa.valor.replace(',', '.'));
    const origemIdNum = parseInt(newDespesa.origem_id);
    const categoriaIdNum = parseInt(newDespesa.categoria_id);

    if (isNaN(valorNum) || isNaN(origemIdNum) || isNaN(categoriaIdNum)) {
      setError('Por favor, preencha todos os campos obrigatórios com valores válidos.');
      return;
    }

    try {
      await createDespesa.mutateAsync({ 
        ...newDespesa, 
        valor: valorNum, 
        origem_id: origemIdNum, 
        categoria_id: categoriaIdNum 
      });
      
      setNewDespesa({ 
        data_compra: format(new Date(), 'yyyy-MM-dd'), 
        data_pagamento: format(new Date(), 'yyyy-MM-dd'), 
        valor: '', 
        descricao: '', 
        origem_id: '', 
        destino: 'Dividir', 
        categoria_id: '' 
      });
      onClose();
      setToast('Despesa adicionada com sucesso!');
    } catch (err: any) {
      setError(err.message || 'Erro ao adicionar despesa. Verifique os campos obrigatórios.');
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Adicionar Despesa"
      className="w-[90%] h-[90%] sm:w-[90%] sm:h-[90%]"
    >
      <form onSubmit={handleAddDespesa} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Data da Compra</label>
            <input 
              type="date" 
              required
              value={newDespesa.data_compra}
              onChange={e => setNewDespesa(prev => ({ ...prev, data_compra: e.target.value }))}
              className="mt-1 w-full rounded-xl border-gray-200 bg-gray-50 p-3 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Data do Pagamento</label>
            <input 
              type="date" 
              required
              value={newDespesa.data_pagamento}
              onChange={e => setNewDespesa(prev => ({ ...prev, data_pagamento: e.target.value }))}
              className="mt-1 w-full rounded-xl border-gray-200 bg-gray-50 p-3 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Valor (R$)</label>
          <input 
            type="number" 
            step="0.01"
            required
            value={newDespesa.valor}
            onChange={e => setNewDespesa(prev => ({ ...prev, valor: e.target.value }))}
            className="mt-1 w-full rounded-xl border-gray-200 bg-gray-50 p-3 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Descrição</label>
          <input 
            type="text" 
            value={newDespesa.descricao}
            onChange={e => setNewDespesa(prev => ({ ...prev, descricao: e.target.value }))}
            placeholder="Ex: Aluguel, Supermercado..."
            className="mt-1 w-full rounded-xl border-gray-200 bg-gray-50 p-3 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Origem (Quem pagou)</label>
          <select 
            required
            value={newDespesa.origem_id}
            onChange={e => setNewDespesa(prev => ({ ...prev, origem_id: e.target.value }))}
            className="mt-1 w-full rounded-xl border-gray-200 bg-gray-50 p-3 outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Selecione...</option>
            {pessoas.map((p: any) => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Destino</label>
          <select 
            required
            value={newDespesa.destino}
            onChange={e => setNewDespesa(prev => ({ ...prev, destino: e.target.value }))}
            className="mt-1 w-full rounded-xl border-gray-200 bg-gray-50 p-3 outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="Dividir">Dividir entre todos</option>
            {pessoas.map((p: any) => (
              <option key={p.id} value={p.id.toString()}>Somente {p.nome}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Categoria</label>
          <select 
            required
            value={newDespesa.categoria_id}
            onChange={e => setNewDespesa(prev => ({ ...prev, categoria_id: e.target.value }))}
            className="mt-1 w-full rounded-xl border-gray-200 bg-gray-50 p-3 outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Selecione...</option>
            {categorias?.map((c: any) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={createDespesa.isPending} className="w-full rounded-xl bg-rose-600 py-3 text-white font-bold shadow-soft hover:bg-rose-700 hover:shadow-lg hover:scale-[1.02] transition-all active:scale-[0.98]">
          {createDespesa.isPending ? 'Salvando...' : 'Salvar'}
        </button>
      </form>
    </Modal>
  );
}
