import React, { useState } from 'react';
import { format } from 'date-fns';
import { Modal } from '../Modal';
import { Pessoa } from '../../types';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  pessoas: Pessoa[];
  importPessoaId: string;
  setImportPessoaId: (id: string) => void;
  importSource: 'extrato' | 'cartao';
  setImportSource: (source: 'extrato' | 'cartao') => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>, globalPaymentDate: string) => void;
}

export const ImportModal = ({
  isOpen,
  onClose,
  pessoas,
  importPessoaId,
  setImportPessoaId,
  importSource,
  setImportSource,
  onFileSelect
}: ImportModalProps) => {
  const [globalPaymentDate, setGlobalPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Importar CSV"
      className="w-[90%] h-[90%] sm:w-[90%] sm:h-[90%]"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Pessoa de Referência</label>
            <select 
              required
              value={importPessoaId}
              onChange={e => setImportPessoaId(e.target.value)}
              className="mt-1 w-full rounded-xl border-gray-200 bg-gray-50 p-3 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Selecione...</option>
              {pessoas.map(p => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Fonte dos Dados</label>
            <select 
              value={importSource}
              onChange={e => setImportSource(e.target.value as 'extrato' | 'cartao')}
              className="mt-1 w-full rounded-xl border-gray-200 bg-gray-50 p-3 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="extrato">Extrato Bancário</option>
              <option value="cartao">Cartão de Crédito</option>
            </select>
          </div>
        </div>
        
        {importSource === 'cartao' && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Data de Pagamento (Fatura)</label>
            <input 
              type="date" 
              value={globalPaymentDate}
              onChange={e => setGlobalPaymentDate(e.target.value)}
              className="mt-1 w-full rounded-xl border-gray-200 bg-gray-50 p-3 outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="mt-1 text-xs text-gray-500">Esta data será aplicada a todos os itens da fatura.</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">Arquivo CSV</label>
          <input 
            type="file" 
            accept=".csv"
            disabled={!importPessoaId}
            onChange={(e) => onFileSelect(e, globalPaymentDate)}
            className="mt-1 w-full rounded-xl border-gray-200 bg-gray-50 p-3 outline-none focus:ring-2 focus:ring-indigo-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
          <p className="mt-2 text-xs text-gray-500">
            Formato: Data;Descrição;Categoria;Valor;Tipo (Entrada ou Saída)<br/>
            Ex: 05/01/2026;IOF;Taxa Banco;17,56;Saída
          </p>
        </div>
      </div>
    </Modal>
  );
};
