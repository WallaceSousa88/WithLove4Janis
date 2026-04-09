import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Filter, Layers, Users, RotateCcw, Trash2 } from 'lucide-react';
import { Modal } from '../Modal';
import { Pessoa } from '../../types';
import { cn } from '../../utils/cn';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

interface ReviewItem {
  id: string;
  data_compra: string;
  data_pagamento: string;
  descricao: string;
  categoria: string;
  valor: number;
  tipo: 'Entrada' | 'Saída';
  destino: string;
}

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviewItems: ReviewItem[];
  setReviewItems: (items: ReviewItem[]) => void;
  pessoas: Pessoa[];
  onConfirm: () => void;
}

export const ReviewModal = ({
  isOpen,
  onClose,
  reviewItems,
  setReviewItems,
  pessoas,
  onConfirm
}: ReviewModalProps) => {
  const [reviewSearchTerm, setReviewSearchTerm] = useState('');

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Revisar Importação"
      className="w-[90%] h-[90%] sm:w-[90%] sm:h-[90%]"
    >
      <div className="flex flex-col h-full space-y-4">
        <div className="sticky top-[-24px] z-20 bg-white/95 backdrop-blur-sm pb-4 pt-2 -mx-6 px-6 border-b border-gray-50 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-gray-600">
              Revise as transações abaixo e selecione o <strong>Destino</strong> para cada despesa.
            </p>
            <div className="flex items-center flex-wrap gap-2">
              <button
                onClick={() => {
                  const newItems = reviewItems.map(item => ({
                    ...item,
                    destino: item.tipo === 'Saída' ? 'Dividir' : item.destino
                  }));
                  setReviewItems(newItems);
                }}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-100 transition-all active:scale-95"
                title="Marcar todas as saídas como 'Dividir'"
              >
                <Layers size={14} />
                Dividir Todos
              </button>

              {pessoas.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    const newItems = reviewItems.map(item => ({
                      ...item,
                      destino: item.tipo === 'Saída' ? p.id.toString() : item.destino
                    }));
                    setReviewItems(newItems);
                  }}
                  style={{ color: p.cor, backgroundColor: `${p.cor}15` }}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all active:scale-95 hover:opacity-80"
                  title={`Marcar todas as saídas para ${p.nome}`}
                >
                  <Users size={14} />
                  {p.nome}
                </button>
              ))}

              <button
                onClick={() => {
                  const newItems = reviewItems.map(item => ({
                    ...item,
                    destino: item.tipo === 'Saída' ? '' : item.destino
                  }));
                  setReviewItems(newItems);
                }}
                className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-100 transition-all active:scale-95"
                title="Limpar todos os destinos selecionados"
              >
                <RotateCcw size={14} />
                Limpar
              </button>
            </div>
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Filtrar itens da importação..."
              value={reviewSearchTerm}
              onChange={e => setReviewSearchTerm(e.target.value)}
              className="w-full rounded-xl border-gray-200 bg-gray-50 py-1.5 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-auto rounded-xl border border-gray-100">
          <table className="w-full text-left text-sm">
            <thead className="text-gray-600">
              <tr>
                <th className="sticky top-0 px-4 py-3 font-semibold bg-gray-100 z-10">Data Compra</th>
                <th className="sticky top-0 px-4 py-3 font-semibold bg-gray-100 z-10">Data Pagto</th>
                <th className="sticky top-0 px-4 py-3 font-semibold bg-gray-100 z-10">Descrição</th>
                <th className="sticky top-0 px-4 py-3 font-semibold bg-gray-100 z-10">Categoria</th>
                <th className="sticky top-0 px-4 py-3 font-semibold bg-gray-100 z-10">Valor</th>
                <th className="sticky top-0 px-4 py-3 font-semibold bg-gray-100 z-10">Tipo</th>
                <th className="sticky top-0 px-4 py-3 font-semibold bg-gray-100 z-10">Destino</th>
                <th className="sticky top-0 px-4 py-3 font-semibold bg-gray-100 z-10 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {reviewItems
                .filter(item => {
                  if (!reviewSearchTerm) return true;
                  const term = reviewSearchTerm.toLowerCase();
                  const dateCompraObj = parseISO(item.data_compra);
                  const datePagtoObj = parseISO(item.data_pagamento);
                  const formattedDateCompra = format(dateCompraObj, 'dd/MM/yyyy');
                  const formattedDatePagto = format(datePagtoObj, 'dd/MM/yyyy');
                  const monthName = format(datePagtoObj, 'MMMM', { locale: ptBR }).toLowerCase();
                  const monthNameShort = format(datePagtoObj, 'MMM', { locale: ptBR }).toLowerCase();
                  
                  let destinoName = '';
                  if (item.tipo === 'Saída') {
                    if (item.destino === 'Dividir') {
                      destinoName = 'Dividir';
                    } else if (item.destino) {
                      const p = pessoas.find(p => p.id === Number(item.destino));
                      destinoName = p ? p.nome : item.destino;
                    }
                  }

                  return (
                    item.descricao.toLowerCase().includes(term) ||
                    item.categoria.toLowerCase().includes(term) ||
                    destinoName.toLowerCase().includes(term) ||
                    item.valor.toString().includes(term) ||
                    item.tipo.toLowerCase().includes(term) ||
                    formattedDateCompra.includes(term) ||
                    formattedDatePagto.includes(term) ||
                    monthName.includes(term) ||
                    monthNameShort.includes(term)
                  );
                })
                .map((item, idx) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-4 py-3 whitespace-nowrap text-xs">{format(parseISO(item.data_compra), 'dd/MM/yyyy')}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-indigo-600">{format(parseISO(item.data_pagamento), 'dd/MM/yyyy')}</td>
                    <td className="px-4 py-3">{item.descricao}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                        {item.categoria}
                      </span>
                    </td>
                    <td className={cn(
                      "px-4 py-3 font-medium whitespace-nowrap",
                      item.tipo === 'Entrada' ? "text-emerald-600" : "text-rose-600"
                    )}>
                      {formatCurrency(item.valor)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "rounded-full px-2 py-1 text-xs font-medium",
                        item.tipo === 'Entrada' ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                      )}>
                        {item.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {item.tipo === 'Saída' ? (
                        <select
                          value={item.destino}
                          onChange={(e) => {
                            const newItems = [...reviewItems];
                            // Careful: find the actual index in reviewItems, not the filtered one
                            const actualIdx = reviewItems.findIndex(ri => ri.id === item.id);
                            if (actualIdx !== -1) {
                              newItems[actualIdx].destino = e.target.value;
                              setReviewItems(newItems);
                            }
                          }}
                          className="w-full rounded-lg border-gray-200 bg-gray-50 p-1 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Selecionar...</option>
                          <option value="Dividir">Dividir entre todos</option>
                          {pessoas.map(p => (
                            <option key={p.id} value={p.id}>{p.nome}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Automático</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          const newItems = reviewItems.filter(ri => ri.id !== item.id);
                          setReviewItems(newItems);
                          if (newItems.length === 0) {
                            onClose();
                          }
                        }}
                        className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        title="Remover linha"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="rounded-xl px-6 py-2 text-gray-600 font-medium hover:bg-gray-100 hover:shadow-sm transition-all active:scale-[0.98]"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="rounded-xl bg-indigo-600 px-8 py-2 text-white font-bold shadow-soft hover:bg-indigo-700 hover:shadow-lg hover:scale-[1.02] transition-all active:scale-[0.98]"
          >
            Confirmar Importação
          </button>
        </div>
      </div>
    </Modal>
  );
};
