import React, { useState } from 'react';
import { Download, Trash2, Search, Pencil, Check, X } from 'lucide-react';
import { Modal } from '../Modal';
import { TableHeader } from '../common/TableHeader';
import { Pessoa, Categoria } from '../../types';
import { cn } from '../../utils/cn';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

interface PersonDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPersonDetails: any;
  pessoas: Pessoa[];
  sortedCategorias: Categoria[];
  personSearchTerm: string;
  setPersonSearchTerm: (term: string) => void;
  summarySort: { key: string; direction: 'asc' | 'desc' } | null;
  setSummarySort: (sort: any) => void;
  onExport: () => void;
  onDeletePerson: (person: Pessoa) => void;
  onDeleteRecord: (id: string, type: 'Entrada' | 'Saída') => void;
  onUpdateValue: (id: string, type: 'Entrada' | 'Saída', newValue: string) => void;
  onUpdateCategory: (id: string, newCategoryId: number) => void;
}

export const PersonDetailModal = ({
  isOpen,
  onClose,
  selectedPersonDetails,
  pessoas,
  sortedCategorias,
  personSearchTerm,
  setPersonSearchTerm,
  summarySort,
  setSummarySort,
  onExport,
  onDeletePerson,
  onDeleteRecord,
  onUpdateValue,
  onUpdateCategory
}: PersonDetailModalProps) => {
  const [editingRecord, setEditingRecord] = useState<{ id: string; type: 'Entrada' | 'Saída'; value: string } | null>(null);
  const [editingRecordCategory, setEditingRecordCategory] = useState<{ id: string; categoryId: number } | null>(null);

  const handleSort = (columnKey: string) => {
    setSummarySort((prev: any) => {
      if (prev?.key === columnKey) {
        return { key: columnKey, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key: columnKey, direction: 'asc' };
    });
  };

  if (!selectedPersonDetails) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={() => {
        onClose();
        setEditingRecord(null);
        setEditingRecordCategory(null);
      }} 
      title={`Resumo: ${selectedPersonDetails.person.nome}`}
      className="sm:w-[90%] sm:h-[90%] max-w-none"
    >
      <div className="space-y-6">
        <div className="flex justify-end items-center gap-2">
          <button
            onClick={onExport}
            className="flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-600 hover:bg-indigo-100 transition-all active:scale-95 shadow-sm"
          >
            <Download size={18} />
          </button>
          <button
            onClick={() => onDeletePerson(selectedPersonDetails.person)}
            className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-100 transition-all active:scale-95 shadow-sm"
            title="Excluir Pessoa e Registros"
          >
            <Trash2 size={18} />
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-100 flex flex-col">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">Entradas</p>
            <p className="text-xl font-bold text-emerald-700 mt-auto">{formatCurrency(selectedPersonDetails.totalSalary)}</p>
          </div>
          <div className="rounded-xl bg-rose-50 p-4 border border-rose-100 flex flex-col">
            <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider mb-1">Saídas (Total)</p>
            <div className="flex items-center mt-auto">
              <div className="flex-1 text-center">
                <p className="text-xl font-bold text-rose-700">{formatCurrency(selectedPersonDetails.totalSpent)}</p>
              </div>
              <div className="flex flex-col justify-center border-l border-rose-200 pl-3 ml-2 shrink-0 text-right">
                <div className="mb-1">
                  <p className="text-[9px] font-bold text-rose-400 uppercase leading-none">Próprias</p>
                  <p className="text-[11px] font-bold text-rose-600">{formatCurrency(selectedPersonDetails.exclusiveSpent)}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-rose-400 uppercase leading-none">Divididas</p>
                  <p className="text-[11px] font-bold text-rose-600">{formatCurrency(selectedPersonDetails.sharedSpent)}</p>
                </div>
              </div>
            </div>
          </div>
          <div className={cn(
            "rounded-xl p-4 border flex flex-col",
            selectedPersonDetails.net >= 0 ? "bg-blue-50 border-blue-100" : "bg-amber-50 border-amber-100"
          )}>
            <p className={cn(
              "text-xs font-semibold uppercase tracking-wider mb-1",
              selectedPersonDetails.net >= 0 ? "text-blue-600" : "text-amber-600"
            )}>Saldo Líquido</p>
            <p className={cn(
              "text-xl font-bold mt-auto",
              selectedPersonDetails.net >= 0 ? "text-blue-700" : "text-amber-700"
            )}>{formatCurrency(selectedPersonDetails.net)}</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Pesquisar movimentações..."
            value={personSearchTerm}
            onChange={(e) => setPersonSearchTerm(e.target.value)}
            className="w-full rounded-xl border-gray-200 bg-gray-50 py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="rounded-xl border border-gray-100 overflow-hidden flex-1">
          <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-gray-100 text-gray-600 z-10">
                <tr>
                  <TableHeader label="Data Compra" columnKey="data_compra" sortState={summarySort} onSort={handleSort} />
                  <TableHeader label="Data Pagto" columnKey="data_pagto" sortState={summarySort} onSort={handleSort} />
                  <TableHeader label="Descrição" columnKey="descricao" sortState={summarySort} onSort={handleSort} />
                  <TableHeader label="Categoria" columnKey="categoria" sortState={summarySort} onSort={handleSort} />
                  <TableHeader label="Destino" columnKey="destino" sortState={summarySort} onSort={handleSort} />
                  <TableHeader label="Valor" columnKey="valor" sortState={summarySort} onSort={handleSort} />
                  <TableHeader label="Tipo" columnKey="tipo" sortState={summarySort} onSort={handleSort} />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 bg-white">
                {selectedPersonDetails.movements.length > 0 ? (
                  selectedPersonDetails.movements.map((m: any) => (
                    <tr key={m.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-4 py-3 whitespace-nowrap text-xs">{m.formattedCompraDate}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-indigo-600">{m.formattedDate}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{m.descricao}</div>
                      </td>
                      <td className="px-4 py-3">
                        {m.tipo === 'Saída' ? (
                          editingRecordCategory?.id === m.id ? (
                            <div className="flex items-center gap-2">
                              <select
                                autoFocus
                                value={editingRecordCategory.categoryId}
                                onChange={e => setEditingRecordCategory({ ...editingRecordCategory, categoryId: parseInt(e.target.value) })}
                                onBlur={() => {
                                  onUpdateCategory(m.id, editingRecordCategory.categoryId);
                                  setEditingRecordCategory(null);
                                }}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    onUpdateCategory(m.id, editingRecordCategory.categoryId);
                                    setEditingRecordCategory(null);
                                  }
                                  if (e.key === 'Escape') setEditingRecordCategory(null);
                                }}
                                className="rounded-lg border-gray-200 bg-gray-50 p-1 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                              >
                                {sortedCategorias.map(cat => (
                                  <option key={cat.id} value={cat.id}>{cat.nome}</option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 group/cat">
                              <span className="text-xs text-gray-600">{m.categoria_nome || 'Sem Categoria'}</span>
                              <button
                                onClick={() => setEditingRecordCategory({ id: m.id, categoryId: m.categoria_id })}
                                className="p-1 text-gray-400 hover:text-indigo-600 opacity-0 group-hover/cat:opacity-100 transition-opacity"
                                title="Editar Categoria"
                              >
                                <Pencil size={12} />
                              </button>
                            </div>
                          )
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-600">
                          {m.tipo === 'Saída' ? (
                            (m.destino === 'Dividir' || m.destino === 'Dividido') ? 'Dividir' : 
                            (pessoas.find(p => p.id === Number(m.destino))?.nome || m.destino || '-')
                          ) : '-'}
                        </span>
                      </td>
                      <td className={cn(
                        "px-4 py-3 font-medium whitespace-nowrap",
                        m.tipo === 'Entrada' ? "text-emerald-600" : "text-rose-600"
                      )}>
                        {editingRecord?.id === m.id ? (
                          <div className="flex items-center gap-2">
                            <input 
                              type="number" 
                              step="0.01"
                              autoFocus
                              value={editingRecord.value}
                              onChange={e => setEditingRecord({ ...editingRecord, value: e.target.value })}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  onUpdateValue(editingRecord.id, editingRecord.type, editingRecord.value);
                                  setEditingRecord(null);
                                }
                                if (e.key === 'Escape') setEditingRecord(null);
                              }}
                              className="w-24 rounded-lg border-gray-200 bg-gray-50 p-1 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button 
                              onClick={() => {
                                onUpdateValue(editingRecord.id, editingRecord.type, editingRecord.value);
                                setEditingRecord(null);
                              }} 
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                            >
                              <Check size={16} />
                            </button>
                            <button onClick={() => setEditingRecord(null)} className="p-1 text-rose-600 hover:bg-rose-50 rounded">
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            {formatCurrency(m.valor)}
                            <button 
                              onClick={() => setEditingRecord({ id: m.id, type: m.tipo, value: m.valor.toString() })}
                              className="p-1 text-gray-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-all"
                              title="Editar Valor"
                            >
                              <Pencil size={14} />
                            </button>
                            <button 
                              onClick={() => onDeleteRecord(m.id, m.tipo)}
                              className="p-1 text-gray-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all"
                              title="Excluir Registro"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "rounded-full px-2 py-1 text-xs font-medium",
                          m.tipo === 'Entrada' ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                        )}>
                          {m.tipo}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500 italic">
                      Nenhuma movimentação este mês.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>
  );
};
