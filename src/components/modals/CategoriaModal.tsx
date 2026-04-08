import React, { useState } from 'react';
import { Modal } from '../Modal';
import { AlertTriangle, Pencil, Trash2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAppMutations } from '../../hooks/useQueries';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function CategoriaModal({ isOpen, onClose, setToast, setError, categorias }: any) {
  const [newCategoria, setNewCategoria] = useState({ nome: '' });
  const [editingCategoria, setEditingCategoria] = useState<{ id: string; nome: string } | null>(null);
  const [categoriaToDelete, setCategoriaToDelete] = useState<any | null>(null);
  const [isDeleteCategoriaModalOpen, setIsDeleteCategoriaModalOpen] = useState(false);

  const { createCategoria, updateCategoria, deleteCategoria } = useAppMutations();

  const handleAddCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCategoria.mutateAsync(newCategoria);
      setNewCategoria({ nome: '' });
      setToast('Categoria adicionada com sucesso!');
    } catch (err: any) {
      setError(err.message || 'Erro ao adicionar categoria.');
    }
  };

  const handleUpdateCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategoria) return;
    try {
      await updateCategoria.mutateAsync({ 
        id: editingCategoria.id, 
        data: { nome: editingCategoria.nome } 
      });
      setEditingCategoria(null);
      setToast('Categoria atualizada com sucesso!');
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar categoria.');
    }
  };

  const handleDeleteCategoria = async () => {
    if (!categoriaToDelete) return;
    try {
      await deleteCategoria.mutateAsync(categoriaToDelete.id);
      setIsDeleteCategoriaModalOpen(false);
      setCategoriaToDelete(null);
      setToast('Categoria excluída com sucesso!');
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir categoria. Ela pode estar em uso.');
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Gerenciar Categoria">
        <div className="space-y-6">
          <form onSubmit={editingCategoria ? handleUpdateCategoria : handleAddCategoria} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {editingCategoria ? 'Editar Categoria' : 'Nova Categoria'}
              </label>
              <div className="mt-1 flex gap-2">
                <input 
                  type="text" 
                  required
                  value={editingCategoria ? editingCategoria.nome : newCategoria.nome}
                  onChange={e => editingCategoria 
                    ? setEditingCategoria({ ...editingCategoria, nome: e.target.value })
                    : setNewCategoria({ nome: e.target.value })
                  }
                  placeholder="Ex: Alimentação, Transporte..."
                  className="flex-1 rounded-xl border-gray-200 bg-gray-50 p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button 
                  type="submit"
                  disabled={createCategoria.isPending || updateCategoria.isPending}
                  className={cn(
                    "rounded-xl px-6 font-bold text-white transition-all active:scale-95",
                    editingCategoria ? "bg-indigo-600 hover:bg-indigo-700" : "bg-amber-600 hover:bg-amber-700"
                  )}
                >
                  {editingCategoria ? 'Atualizar' : 'Adicionar'}
                </button>
                {editingCategoria && (
                  <button 
                    type="button"
                    onClick={() => setEditingCategoria(null)}
                    className="rounded-xl bg-gray-100 px-4 font-bold text-gray-600 hover:bg-gray-200 transition-all active:scale-95"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          </form>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Categorias Existentes</h3>
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar rounded-xl border border-gray-100 divide-y divide-gray-50">
              {categorias && categorias.length > 0 ? (
                categorias.map((cat: any) => (
                  <div key={cat.id} className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors group">
                    <span className="font-medium text-gray-700">{cat.nome}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => setEditingCategoria({ id: cat.id, nome: cat.nome })}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                      <button 
                        onClick={() => {
                          setCategoriaToDelete(cat);
                          setIsDeleteCategoriaModalOpen(true);
                        }}
                        className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-400 italic">
                  Nenhuma categoria cadastrada.
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isDeleteCategoriaModalOpen} onClose={() => setIsDeleteCategoriaModalOpen(false)} title="Confirmar Exclusão">
        <div className="space-y-6">
          <div className="flex items-center gap-4 text-rose-600">
            <div className="rounded-full bg-rose-100 p-3">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="font-bold">Excluir Categoria?</h3>
              <p className="text-sm text-gray-600">
                Você está prestes a excluir a categoria <strong>{categoriaToDelete?.nome}</strong>.
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            Esta ação não poderá ser desfeita. A categoria só poderá ser excluída se não houver despesas vinculadas a ela.
          </p>
          <div className="flex gap-3">
            <button 
              onClick={() => setIsDeleteCategoriaModalOpen(false)}
              className="flex-1 rounded-xl bg-gray-100 py-3 font-bold text-gray-600 hover:bg-gray-200 transition-all"
            >
              Cancelar
            </button>
            <button 
              onClick={handleDeleteCategoria}
              disabled={deleteCategoria.isPending}
              className="flex-1 rounded-xl bg-rose-600 py-3 font-bold text-white shadow-soft hover:bg-rose-700 transition-all"
            >
              {deleteCategoria.isPending ? 'Excluindo...' : 'Confirmar Exclusão'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
