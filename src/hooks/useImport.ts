import React, { useState } from 'react';
import { Pessoa, Categoria } from '../types';

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

export const useImport = (
  pessoas: Pessoa[], 
  categorias: Categoria[], 
  setToast: (msg: string | null) => void, 
  setError: (msg: string | null) => void
) => {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [importPessoaId, setImportPessoaId] = useState('');
  const [importSource, setImportSource] = useState<'extrato' | 'cartao'>('extrato');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>, globalPaymentDate: string) => {
    const file = e.target.files?.[0];
    if (!file || !importPessoaId) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      
      let decoder = new TextDecoder('utf-8');
      let text = decoder.decode(buffer);
      
      if (text.includes('') || text.includes('\ufffd')) {
        decoder = new TextDecoder('iso-8859-1');
        text = decoder.decode(buffer);
      }

      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
      if (lines.length === 0) return;

      const startIdx = lines[0].toLowerCase().includes('data') ? 1 : 0;

      const items: ReviewItem[] = [];
      for (let i = startIdx; i < lines.length; i++) {
        const parts = lines[i].split(';');
        if (parts.length < 5) continue;
        
        const [dataStr, descricao, categoriaNome, valorStr, tipoRaw] = parts;
        if (!dataStr || !valorStr || !tipoRaw) continue;

        const dateParts = dataStr.trim().split('/');
        if (dateParts.length !== 3) continue;
        const [day, month, year] = dateParts;
        const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

        let cleanValor = valorStr.trim().replace(/[R$\s]/g, '');
        if (cleanValor.includes(',') && cleanValor.includes('.')) {
          cleanValor = cleanValor.replace(/\./g, '').replace(',', '.');
        } else if (cleanValor.includes(',')) {
          cleanValor = cleanValor.replace(',', '.');
        }
        
        const valor = parseFloat(cleanValor);
        if (isNaN(valor)) continue;

        const tipo = tipoRaw.trim().toLowerCase().includes('entrada') ? 'Entrada' : 'Saída';

        items.push({
          id: Math.random().toString(36).substr(2, 9),
          data_compra: formattedDate,
          data_pagamento: importSource === 'extrato' ? formattedDate : globalPaymentDate,
          descricao: descricao.trim(),
          categoria: categoriaNome.trim() || 'Geral',
          valor,
          tipo,
          destino: tipo === 'Entrada' ? importPessoaId : '' 
        });
      }
      setReviewItems(items);
      setIsImportModalOpen(false);
      setIsReviewModalOpen(true);
      e.target.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  const handleConfirmImport = async () => {
    const hasEmptyDestino = reviewItems.some(item => item.tipo === 'Saída' && !item.destino);
    if (hasEmptyDestino) {
      setError('Por favor, selecione o destino para todas as despesas.');
      return;
    }

    setIsLoading(true);
    setLoadingMessage('Processando importação...');
    try {
      const categoryCache = new Map<string, number>();
      categorias.forEach(c => categoryCache.set(c.nome.toLowerCase(), c.id));

      for (const item of reviewItems) {
        let categoriaId: number | null = null;
        const catNameLower = item.categoria.toLowerCase();
        
        if (categoryCache.has(catNameLower)) {
          categoriaId = categoryCache.get(catNameLower)!;
        } else {
          const res = await fetch('/api/categorias', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome: item.categoria }),
          });
          const data = await res.json();
          if (data.id) {
            categoriaId = data.id;
            categoryCache.set(catNameLower, data.id);
          }
        }

        if (item.tipo === 'Entrada') {
          const res = await fetch('/api/salarios', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              data_pagamento: item.data_pagamento,
              valor: item.valor,
              descricao: item.descricao,
              recebedor_id: parseInt(importPessoaId)
            }),
          });
          if (!res.ok) {
            const data = await res.json();
            if (res.status === 400 && data.error?.includes('duplicado')) {
              continue; 
            }
            throw new Error(data.error || 'Erro ao salvar entrada');
          }
        } else {
          if (categoriaId) {
            const res = await fetch('/api/despesas', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                data_compra: item.data_compra,
                data_pagamento: item.data_pagamento,
                valor: item.valor,
                descricao: item.descricao,
                origem_id: parseInt(importPessoaId),
                destino: item.destino,
                categoria_id: categoriaId,
                ignoreDuplicates: true
              }),
            });
            if (!res.ok) {
              const data = await res.json();
              throw new Error(data.error || 'Erro ao salvar despesa');
            }
          }
        }
      }
      setIsReviewModalOpen(false);
      setReviewItems([]);
      setImportPessoaId('');
      setToast('Importação concluída com sucesso!');
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error('Import error:', err);
      setError('Erro durante a importação. Algumas transações podem não ter sido salvas.');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isImportModalOpen, setIsImportModalOpen,
    isReviewModalOpen, setIsReviewModalOpen,
    reviewItems, setReviewItems,
    importPessoaId, setImportPessoaId,
    importSource, setImportSource,
    isLoading, loadingMessage,
    handleImportCSV,
    handleConfirmImport
  };
};
