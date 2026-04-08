import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Filter, Users, DollarSign, CreditCard, Tag, TrendingUp, ChevronDown, ChevronUp, ClipboardCheck, Trash2, Download, Upload, RotateCcw, Layers, Loader2, PieChart as PieChartIcon, BarChart as BarChartIcon, Check, X, Search, Pencil, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Sector, Legend
} from 'recharts';
import { 
  format, parseISO, startOfDay, endOfDay
} from 'date-fns';
import { usePessoas, useCategorias, useDespesas, useSalarios, useLogs, useAppMutations } from './hooks/useQueries';
import { useFilters } from './context/FilterContext';
import { useDashboardData } from './hooks/useDashboardData';
import { ptBR } from 'date-fns/locale';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Pessoa, Categoria, Despesa, Salario, PALETTES } from './types';
import { copyToClipboard as copyToClipboardUtil } from './utils/clipboard';
import { Modal } from './components/Modal';
import { ErrorModal } from './components/ErrorModal';
import { ConfirmModal } from './components/ConfirmModal';
import { ExportModal, ExportOptions } from './components/ExportModal';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { PessoaModal } from './components/modals/PessoaModal';
import { DespesaModal } from './components/modals/DespesaModal';
import { SalarioModal } from './components/modals/SalarioModal';
import { CategoriaModal } from './components/modals/CategoriaModal';
import { PersonCard } from './components/dashboard/PersonCard';
import { DashboardCharts } from './components/dashboard/DashboardCharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};





export default function App() {
  const { 
    startDate, setStartDate, endDate, setEndDate, 
    filterMonth, setFilterMonth, filterYear, setFilterYear,
    chartPersonFilter, setChartPersonFilter,
    personSearchTerm, setPersonSearchTerm,
    logSearchTerm, setLogSearchTerm,
    logSort, setLogSort,
    importPessoaId, setImportPessoaId,
    reviewSearchTerm, setReviewSearchTerm,
    selectedPersonId, setSelectedPersonId,
    isPersonDetailModalOpen, setIsPersonDetailModalOpen,
    toast, setToast, error, setError
  } = useFilters();

  const { data: pessoas = [] } = usePessoas();
  const { data: categorias = [] } = useCategorias();
  const { data: despesas = [] } = useDespesas();
  const { data: salarios = [] } = useSalarios();
  const { data: auditLogs = [] } = useLogs();
  
  const { 
    updateDespesa, deleteDespesa, updateSalario, deleteSalario, 
    deletePessoa, resetData, updateCategoria 
  } = useAppMutations();

  const {
    filteredDespesas, filteredSalarios, hasRecords, balances,
    personStats, selectedPersonDetails, barChartData, pieChartData,
    filteredMovements, availableYears, availableMonths
  } = useDashboardData({
    pessoas, categorias, despesas, salarios, auditLogs,
    startDate, endDate, filterMonth, filterYear,
    chartPersonFilter, personSearchTerm, logSearchTerm, selectedPersonId
  });

  const sortedCategorias = useMemo(() => {
    return [...categorias].sort((a, b) => a.nome.localeCompare(b.nome));
  }, [categorias]);

  const [isPessoaModalOpen, setIsPessoaModalOpen] = useState(false);
  const [isDespesaModalOpen, setIsDespesaModalOpen] = useState(false);
  const [isSalarioModalOpen, setIsSalarioModalOpen] = useState(false);
  const [isCategoriaModalOpen, setIsCategoriaModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isDeletePessoaModalOpen, setIsDeletePessoaModalOpen] = useState(false);
  const [personToDelete, setPersonToDelete] = useState<Pessoa | null>(null);
  const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [pendingRestoreFile, setPendingRestoreFile] = useState<File | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewItems, setReviewItems] = useState<any[]>([]);
  const [importSource, setImportSource] = useState<'extrato' | 'cartao'>('extrato');
  const [globalPaymentDate, setGlobalPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [editingRecord, setEditingRecord] = useState<{ id: string; type: 'Entrada' | 'Saída'; value: string } | null>(null);
  const [editingRecordCategory, setEditingRecordCategory] = useState<{ id: string; categoryId: number } | null>(null);

  const handleUpdateCategory = (id: string, newCategoryId: number) => {
    const despesaId = parseInt(id.split('-')[1]);
    updateDespesa.mutate({ id: despesaId, data: { categoria_id: newCategoryId } }, {
      onSuccess: () => {
        setToast('Categoria atualizada com sucesso!');
        setEditingRecordCategory(null);
      },
      onError: () => setError('Erro ao atualizar categoria')
    });
  };

  const handleUpdateValue = () => {
    if (!editingRecord) return;
    const valorNum = parseFloat(editingRecord.value);
    if (isNaN(valorNum)) return setError('Valor inválido');

    const id = parseInt(editingRecord.id.split('-')[1]);
    if (editingRecord.type === 'Saída') {
      updateDespesa.mutate({ id, data: { valor: valorNum } }, {
        onSuccess: () => { setToast('Valor atualizado!'); setEditingRecord(null); },
        onError: () => setError('Erro ao atualizar')
      });
    } else {
      updateSalario.mutate({ id, data: { valor: valorNum } }, {
        onSuccess: () => { setToast('Valor atualizado!'); setEditingRecord(null); },
        onError: () => setError('Erro ao atualizar')
      });
    }
  };

  const handleDeleteRecord = (id: string, type: 'Entrada' | 'Saída') => {
    if (!window.confirm('Excluir permanentemente?')) return;
    const recordId = parseInt(id.split('-')[1]);
    if (type === 'Saída') {
      deleteDespesa.mutate(recordId, { onSuccess: () => setToast('Excluído!') });
    } else {
      deleteSalario.mutate(recordId, { onSuccess: () => setToast('Excluído!') });
    }
  };

  const handleDeletePessoa = () => {
    if (!personToDelete) return;
    deletePessoa.mutate(personToDelete.id, {
      onSuccess: () => {
        setIsDeletePessoaModalOpen(false);
        setIsPersonDetailModalOpen(false);
        setPersonToDelete(null);
        setSelectedPersonId(null);
        setToast('Pessoa excluída com sucesso!');
      },
      onError: () => setError('Erro ao excluir pessoa')
    });
  };

  const handleResetData = () => {
    resetData.mutate(undefined, {
      onSuccess: () => setIsResetConfirmOpen(false),
      onError: () => setError('Erro ao resetar')
    });
  };

  const LogTableHeader = ({ label, columnKey }: { label: string, columnKey: string }) => {
    const isSorted = logSort?.key === columnKey;
    const handleSort = () => {
      setLogSort(prev => {
        if (prev?.key === columnKey) {
          return { key: columnKey, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
        }
        return { key: columnKey, direction: 'asc' };
      });
    };
    return (
      <th 
        className="px-4 py-3 font-semibold cursor-pointer hover:bg-gray-200 transition-colors select-none group"
        onClick={handleSort}
      >
        <div className="flex items-center gap-2">
          <span className="truncate">{label}</span>
          <div className="flex flex-col shrink-0">
            {isSorted ? (
              logSort.direction === 'asc' ? (
                <ChevronUp size={14} className="text-indigo-600" />
              ) : (
                <ChevronDown size={14} className="text-indigo-600" />
              )
            ) : (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronUp size={14} className="text-gray-400" />
              </div>
            )}
          </div>
        </div>
      </th>
    );
  };

  const handleDownloadBackup = () => {
    window.location.href = '/api/backup';
  };

  const handleRestoreBackup = async () => {
    if (!pendingRestoreFile) return;
    
    setIsLoading(true);
    setLoadingMessage('Restaurando backup...');
    const formData = new FormData();
    formData.append('backup', pendingRestoreFile);

    try {
      const res = await fetch('/api/restore', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao restaurar backup');
      }

      setIsRestoreConfirmOpen(false);
      setPendingRestoreFile(null);
      setToast('Backup restaurado com sucesso! Recarregando...');
      setTimeout(() => window.location.reload(), 2000);
    } catch (err: any) {
      setError(err.message);
      setIsRestoreConfirmOpen(false);
      setPendingRestoreFile(null);
    } finally {
      setIsLoading(false);
    }
  };

  // palette color picked in Modal

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !importPessoaId) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      
      // Try UTF-8 first
      let decoder = new TextDecoder('utf-8');
      let text = decoder.decode(buffer);
      
      // If we see the replacement character or common corruption for "Saída", try ISO-8859-1
      if (text.includes('') || text.includes('\ufffd')) {
        decoder = new TextDecoder('iso-8859-1');
        text = decoder.decode(buffer);
      }

      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
      if (lines.length === 0) return;

      const startIdx = lines[0].toLowerCase().includes('data') ? 1 : 0;

      const items: any[] = [];
      for (let i = startIdx; i < lines.length; i++) {
        const parts = lines[i].split(';');
        if (parts.length < 5) continue;
        
        const [dataStr, descricao, categoriaNome, valorStr, tipoRaw] = parts;
        if (!dataStr || !valorStr || !tipoRaw) continue;

        const dateParts = dataStr.trim().split('/');
        if (dateParts.length !== 3) continue;
        const [day, month, year] = dateParts;
        const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

        // Robust value parsing for Brazilian format (1.234,56 or 1234,56 or 1234.56)
        let cleanValor = valorStr.trim().replace(/[R$\s]/g, '');
        if (cleanValor.includes(',') && cleanValor.includes('.')) {
          // Likely 1.234,56 -> remove dot, replace comma with dot
          cleanValor = cleanValor.replace(/\./g, '').replace(',', '.');
        } else if (cleanValor.includes(',')) {
          // Likely 123,45 -> replace comma with dot
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
      // Local cache for categories to handle new ones in the same batch
      const categoryCache = new Map<string, number>();
      categorias.forEach(c => categoryCache.set(c.nome.toLowerCase(), c.id));

      // Process all items
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
                ignoreDuplicates: true // Allow identical transactions in the same import
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

  const handleExportData = async (options: ExportOptions) => {
    if (!selectedPersonDetails) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Resumo');

    const columns: any[] = [];
    if (options.columns.includes('date')) columns.push({ header: 'Data Pagamento', key: 'date', width: 15 });
    if (options.columns.includes('date_compra')) columns.push({ header: 'Data Compra', key: 'date_compra', width: 15 });
    if (options.columns.includes('description')) columns.push({ header: 'Descrição', key: 'description', width: 35 });
    if (options.columns.includes('category')) columns.push({ header: 'Categoria', key: 'category', width: 20 });
    if (options.columns.includes('destino')) columns.push({ header: 'Destino', key: 'destino', width: 20 });
    if (options.columns.includes('value')) columns.push({ header: 'Valor', key: 'value', width: 15 });
    if (options.columns.includes('type')) columns.push({ header: 'Tipo', key: 'type', width: 15 });
    worksheet.columns = columns;

    selectedPersonDetails.movements.forEach((m: any) => {
      const row: any = {};
      if (options.columns.includes('date')) row['date'] = m.formattedDate;
      if (options.columns.includes('date_compra')) row['date_compra'] = m.formattedCompraDate;
      if (options.columns.includes('description')) row['description'] = m.descricao;
      if (options.columns.includes('category')) row['category'] = m.categoria_nome || '-';
      if (options.columns.includes('destino')) {
        row['destino'] = m.tipo === 'Saída' ? (
          (m.destino === 'Dividir' || m.destino === 'Dividido') ? 'Dividir' : 
          (pessoas.find(p => p.id === Number(m.destino))?.nome || m.destino || '-')
        ) : '-';
      }
      if (options.columns.includes('value')) row['value'] = m.valor;
      if (options.columns.includes('type')) row['type'] = m.tipo;
      worksheet.addRow(row);
    });

    if (options.format === 'xlsx') {
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `${options.filename}.xlsx`);
    } else {
      const buffer = await workbook.csv.writeBuffer();
      saveAs(new Blob([buffer]), `${options.filename}.csv`);
    }
  };

  const handleExportLog = async (options: ExportOptions) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Log_Atividades');

    const columns: any[] = [];
    if (options.columns.includes('date')) columns.push({ header: 'Data Pagamento', key: 'date', width: 15 });
    if (options.columns.includes('date_compra')) columns.push({ header: 'Data Compra', key: 'date_compra', width: 15 });
    if (options.columns.includes('description')) columns.push({ header: 'Descrição', key: 'description', width: 35 });
    if (options.columns.includes('category')) columns.push({ header: 'Categoria', key: 'category', width: 20 });
    if (options.columns.includes('value')) columns.push({ header: 'Valor', key: 'value', width: 15 });
    if (options.columns.includes('type')) columns.push({ header: 'Tipo', key: 'type', width: 15 });
    if (options.columns.includes('person')) columns.push({ header: 'Pessoa', key: 'person', width: 20 });
    if (options.columns.includes('destination')) columns.push({ header: 'Destino', key: 'destination', width: 20 });
    worksheet.columns = columns;

    filteredMovements.forEach((m: any) => {
      const row: any = {};
      if (options.columns.includes('date')) row['date'] = m.formattedDate;
      if (options.columns.includes('date_compra')) row['date_compra'] = m.formattedCompraDate;
      if (options.columns.includes('description')) row['description'] = m.descricao;
      if (options.columns.includes('category')) row['category'] = m.categoria || '-';
      if (options.columns.includes('value')) row['value'] = m.valor;
      if (options.columns.includes('type')) row['type'] = m.tipo;
      if (options.columns.includes('person')) row['person'] = m.pessoa;
      if (options.columns.includes('destination')) row['destination'] = m.destino;
      worksheet.addRow(row);
    });

    if (options.format === 'xlsx') {
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `${options.filename}.xlsx`);
    } else {
      const buffer = await workbook.csv.writeBuffer();
      saveAs(new Blob([buffer]), `${options.filename}.csv`);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-sm"
          >
            <div className="flex flex-col items-center gap-4 p-8 rounded-3xl bg-white shadow-2xl border border-gray-100">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="text-indigo-600"
              >
                <Loader2 size={48} />
              </motion.div>
              <p className="text-lg font-bold text-gray-800 tracking-tight">{loadingMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <Sidebar 
        onOpenPessoaModal={() => setIsPessoaModalOpen(true)}
        onOpenCategoriaModal={() => setIsCategoriaModalOpen(true)}
        onOpenSalarioModal={() => setIsSalarioModalOpen(true)}
        onOpenDespesaModal={() => setIsDespesaModalOpen(true)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        setToast={setToast}
        setError={setError}
      />

      {/* Main Content */}
      <main className="flex-1 ml-72 p-6 flex flex-col overflow-hidden">
        <div className="w-[95%] mx-auto flex flex-col h-full">
          <Header 
            filterMonth={filterMonth} setFilterMonth={setFilterMonth}
            availableMonths={availableMonths}
            filterYear={filterYear} setFilterYear={setFilterYear}
            availableYears={availableYears}
            startDate={startDate} setStartDate={setStartDate}
            endDate={endDate} setEndDate={setEndDate}
            onResetConfirm={() => setIsResetConfirmOpen(true)}
            onDownloadBackup={handleDownloadBackup}
            onRestoreSelect={(file) => {
              setPendingRestoreFile(file);
              setIsRestoreConfirmOpen(true);
            }}
          />

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Left Column: Balance and Person Cards */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-6">
          <div className="min-h-full flex flex-col gap-4 justify-center">
            {/* Yellow Balance Card */}
            {hasRecords && (
              <div className="w-full rounded-2xl bg-yellow-100 p-4 shadow-soft border-2 border-yellow-200 shrink-0">
                <div className="mb-2 flex items-center gap-2 text-yellow-800">
                  <TrendingUp size={20} />
                  <h2 className="text-lg font-bold">Ajustes de Saldo</h2>
                </div>
                {balances.length > 0 ? (
                  <ul className="space-y-1">
                    {balances.map((adj, i) => (
                      <li key={i} className="text-sm text-yellow-900 font-medium">• {adj}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-yellow-800 italic">Tudo equilibrado! Ninguém deve ninguém.</p>
                )}
              </div>
            )}

            {/* Person Cards Stack */}
            <div className="flex flex-col gap-4">
              {personStats.map(p => (
                <PersonCard 
                  key={p.id}
                  person={p}
                  formatCurrency={formatCurrency}
                  onClick={() => {
                    setSelectedPersonId(p.id);
                    setIsPersonDetailModalOpen(true);
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <DashboardCharts
          hasRecords={hasRecords}
          pessoas={pessoas}
          chartPersonFilter={chartPersonFilter}
          setChartPersonFilter={setChartPersonFilter}
          barChartData={barChartData}
          pieChartData={pieChartData}
        />
      </div>

      {/* Modals */}
      <PessoaModal 
        isOpen={isPessoaModalOpen} 
        onClose={() => setIsPessoaModalOpen(false)} 
        setToast={setToast} 
        setError={setError} 
        pessoas={pessoas} 
      />

      <DespesaModal 
        isOpen={isDespesaModalOpen} 
        onClose={() => setIsDespesaModalOpen(false)} 
        setToast={setToast} 
        setError={setError} 
        pessoas={pessoas} 
        categorias={sortedCategorias} 
      />

      <SalarioModal 
        isOpen={isSalarioModalOpen} 
        onClose={() => setIsSalarioModalOpen(false)} 
        setToast={setToast} 
        setError={setError} 
        pessoas={pessoas} 
      />

      <CategoriaModal 
        isOpen={isCategoriaModalOpen} 
        onClose={() => setIsCategoriaModalOpen(false)} 
        setToast={setToast} 
        setError={setError} 
        categorias={sortedCategorias} 
      />

      <Modal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
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
              onChange={handleImportCSV}
              className="mt-1 w-full rounded-xl border-gray-200 bg-gray-50 p-3 outline-none focus:ring-2 focus:ring-indigo-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            <p className="mt-2 text-xs text-gray-500">
              Formato: Data;Descrição;Categoria;Valor;Tipo (Entrada ou Saída)<br/>
              Ex: 05/01/2026;IOF;Taxa Banco;17,56;Saída
            </p>
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={isPersonDetailModalOpen} 
        onClose={() => {
          setIsPersonDetailModalOpen(false);
          setSelectedPersonId(null);
          setPersonSearchTerm('');
        }} 
        title={`Resumo: ${selectedPersonDetails?.person.nome || ''}`}
        className="sm:w-[90%] sm:h-[90%] max-w-none"
      >
        {selectedPersonDetails && (
          <div className="space-y-6">
            <div className="flex justify-end items-center gap-2">
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-600 hover:bg-indigo-100 transition-all active:scale-95 shadow-sm"
              >
                <Download size={18} />
              </button>
              <button
                onClick={() => {
                  setPersonToDelete(selectedPersonDetails.person);
                  setIsDeletePessoaModalOpen(true);
                }}
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
                      <th className="px-4 py-3 font-semibold">Data Compra</th>
                      <th className="px-4 py-3 font-semibold">Data Pagto</th>
                      <th className="px-4 py-3 font-semibold">Descrição</th>
                      <th className="px-4 py-3 font-semibold">Categoria</th>
                      <th className="px-4 py-3 font-semibold">Destino</th>
                      <th className="px-4 py-3 font-semibold">Valor</th>
                      <th className="px-4 py-3 font-semibold">Tipo</th>
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
                                    onBlur={() => handleUpdateCategory(m.id, editingRecordCategory.categoryId)}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') handleUpdateCategory(m.id, editingRecordCategory.categoryId);
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
                                    if (e.key === 'Enter') handleUpdateValue();
                                    if (e.key === 'Escape') setEditingRecord(null);
                                  }}
                                  className="w-24 rounded-lg border-gray-200 bg-gray-50 p-1 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <button onClick={handleUpdateValue} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
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
                                  onClick={() => handleDeleteRecord(m.id, m.tipo)}
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
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-500 italic">
                          Nenhuma movimentação este mês.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExportData}
        defaultFilenamePrefix={`Resumo_${(selectedPersonDetails?.person.nome || '').replace(/\s+/g, '_')}`}
      />

      <Modal 
        isOpen={isReviewModalOpen} 
        onClose={() => setIsReviewModalOpen(false)} 
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
                            newItems[idx].destino = e.target.value;
                            setReviewItems(newItems);
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
                          const newItems = reviewItems.filter((_, i) => i !== idx);
                          setReviewItems(newItems);
                          if (newItems.length === 0) {
                            setIsReviewModalOpen(false);
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
              onClick={() => setIsReviewModalOpen(false)}
              className="rounded-xl px-6 py-2 text-gray-600 font-medium hover:bg-gray-100 hover:shadow-sm transition-all active:scale-[0.98]"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmImport}
              className="rounded-xl bg-indigo-600 px-8 py-2 text-white font-bold shadow-soft hover:bg-indigo-700 hover:shadow-lg hover:scale-[1.02] transition-all active:scale-[0.98]"
            >
              Confirmar Importação
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={isDeletePessoaModalOpen}
        onClose={() => {
          setIsDeletePessoaModalOpen(false);
          setPersonToDelete(null);
        }}
        onConfirm={handleDeletePessoa}
        title="Excluir Pessoa Permanentemente?"
        message={`ATENÇÃO: Esta ação é irreversível. Ao excluir ${personToDelete?.nome}, TODOS os registros de despesas e entradas associados a esta pessoa serão apagados do sistema para sempre. Deseja prosseguir?`}
        confirmLabel="Sim, Excluir Tudo"
        cancelLabel="Não, Manter Dados"
        type="danger"
      />

      <ConfirmModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleResetData}
        title="Limpar Todos os Dados?"
        message="Esta ação irá excluir permanentemente todas as pessoas, categorias, despesas e entradas. Esta ação não pode ser desfeita. Deseja continuar?"
        confirmLabel="Sim, Limpar Tudo"
        cancelLabel="Cancelar"
        type="danger"
      />

      <ConfirmModal
        isOpen={isRestoreConfirmOpen}
        onClose={() => {
          setIsRestoreConfirmOpen(false);
          setPendingRestoreFile(null);
        }}
        onConfirm={handleRestoreBackup}
        title="Restaurar Banco de Dados?"
        message="Esta ação irá SUBSTITUIR COMPLETAMENTE todos os dados atuais pelo conteúdo do arquivo de backup. Esta ação não pode ser desfeita."
        confirmLabel="Substituir Tudo"
        cancelLabel="Cancelar"
        type="warning"
      />

      <ErrorModal 
        isOpen={!!error} 
        onClose={() => setError(null)} 
        message={error || ''} 
      />

      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="rounded-2xl bg-gray-900 px-6 py-3 text-white shadow-2xl flex items-center gap-3">
            <ClipboardCheck className="text-emerald-400" size={20} />
            <span className="font-medium">{toast}</span>
          </div>
        </div>
      )}
        </div>
      </main>
    </div>
  );
}
