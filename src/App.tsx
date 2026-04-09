import React, { useState, useMemo } from 'react';
import { ClipboardCheck, Loader2, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePessoas, useCategorias, useDespesas, useSalarios, useLogs, useAppMutations } from './hooks/useQueries';
import { useFilters } from './context/FilterContext';
import { useDashboardData } from './hooks/useDashboardData';
import { useImport } from './hooks/useImport';
import { useExport } from './hooks/useExport';
import { Modal } from './components/Modal';
import { ErrorModal } from './components/ErrorModal';
import { ConfirmModal } from './components/ConfirmModal';
import { ExportModal } from './components/ExportModal';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { PessoaModal } from './components/modals/PessoaModal';
import { DespesaModal } from './components/modals/DespesaModal';
import { SalarioModal } from './components/modals/SalarioModal';
import { CategoriaModal } from './components/modals/CategoriaModal';
import { ImportModal } from './components/modals/ImportModal';
import { ReviewModal } from './components/modals/ReviewModal';
import { PersonDetailModal } from './components/modals/PersonDetailModal';
import { PersonCard } from './components/dashboard/PersonCard';
import { DashboardCharts } from './components/dashboard/DashboardCharts';
import { cn } from './utils/cn';
import { Pessoa, Categoria } from './types';

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
    logSearchTerm,
    importPessoaId, setImportPessoaId,
    selectedPersonId, setSelectedPersonId,
    isPersonDetailModalOpen, setIsPersonDetailModalOpen,
    summarySort, setSummarySort,
    toast, setToast, error, setError
  } = useFilters();

  const { data: pessoas = [] } = usePessoas();
  const { data: categorias = [] } = useCategorias();
  const { data: despesas = [] } = useDespesas();
  const { data: salarios = [] } = useSalarios();
  const { data: auditLogs = [] } = useLogs();
  
  const { 
    updateDespesa, deleteDespesa, updateSalario, deleteSalario, 
    deletePessoa, resetData 
  } = useAppMutations();

  const {
    hasRecords, balances, personStats, selectedPersonDetails, 
    barChartData, pieChartData, filteredMovements, availableYears, availableMonths
  } = useDashboardData({
    pessoas, categorias, despesas, salarios, auditLogs,
    startDate, endDate, filterMonth, filterYear,
    chartPersonFilter, personSearchTerm, logSearchTerm, selectedPersonId, summarySort
  });

  const sortedCategorias = useMemo(() => {
    return [...categorias].sort((a, b) => a.nome.localeCompare(b.nome));
  }, [categorias]);

  const { handleExportData } = useExport();
  const {
    isImportModalOpen, setIsImportModalOpen,
    isReviewModalOpen, setIsReviewModalOpen,
    reviewItems, setReviewItems,
    importSource, setImportSource,
    isLoading: isImportLoading, loadingMessage,
    handleImportCSV,
    handleConfirmImport
  } = useImport(pessoas, categorias, setToast, setError);

  const [isPessoaModalOpen, setIsPessoaModalOpen] = useState(false);
  const [isDespesaModalOpen, setIsDespesaModalOpen] = useState(false);
  const [isSalarioModalOpen, setIsSalarioModalOpen] = useState(false);
  const [isCategoriaModalOpen, setIsCategoriaModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isDeletePessoaModalOpen, setIsDeletePessoaModalOpen] = useState(false);
  const [personToDelete, setPersonToDelete] = useState<Pessoa | null>(null);
  const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [pendingRestoreFile, setPendingRestoreFile] = useState<File | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleUpdateCategory = (id: string, newCategoryId: number) => {
    const despesaId = parseInt(id.split('-')[1]);
    updateDespesa.mutate({ id: despesaId, data: { categoria_id: newCategoryId } }, {
      onSuccess: () => setToast('Categoria atualizada!'),
      onError: () => setError('Erro ao atualizar categoria')
    });
  };

  const handleUpdateValue = (id: string, type: 'Entrada' | 'Saída', newValue: string) => {
    const valorNum = parseFloat(newValue);
    if (isNaN(valorNum)) return setError('Valor inválido');

    const recordId = parseInt(id.split('-')[1]);
    const mutation = type === 'Saída' ? updateDespesa : updateSalario;
    
    mutation.mutate({ id: recordId, data: { valor: valorNum } }, {
      onSuccess: () => setToast('Valor atualizado!'),
      onError: () => setError('Erro ao atualizar')
    });
  };

  const handleDeleteRecord = (id: string, type: 'Entrada' | 'Saída') => {
    if (!window.confirm('Excluir permanentemente?')) return;
    const recordId = parseInt(id.split('-')[1]);
    const mutation = type === 'Saída' ? deleteDespesa : deleteSalario;
    
    mutation.mutate(recordId, { onSuccess: () => setToast('Excluído!') });
  };

  const handleDeletePessoa = () => {
    if (!personToDelete) return;
    deletePessoa.mutate(personToDelete.id, {
      onSuccess: () => {
        setIsDeletePessoaModalOpen(false);
        setIsPersonDetailModalOpen(false);
        setSelectedPersonId(null);
        setToast('Pessoa excluída!');
      },
      onError: () => setError('Erro ao excluir pessoa')
    });
  };

  const handleRestoreBackup = async () => {
    if (!pendingRestoreFile) return;
    setIsSyncing(true);
    const formData = new FormData();
    formData.append('backup', pendingRestoreFile);

    try {
      const res = await fetch('/api/restore', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Erro ao restaurar backup');
      setToast('Backup restaurado! Recarregando...');
      setTimeout(() => window.location.reload(), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSyncing(false);
      setIsRestoreConfirmOpen(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <AnimatePresence>
        {(isImportLoading || isSyncing) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4 p-8 rounded-3xl bg-white shadow-2xl border border-gray-100">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="text-indigo-600"><Loader2 size={48} /></motion.div>
              <p className="text-lg font-bold text-gray-800">{loadingMessage || 'Processando...'}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Sidebar 
        onOpenPessoaModal={() => setIsPessoaModalOpen(true)}
        onOpenCategoriaModal={() => setIsCategoriaModalOpen(true)}
        onOpenSalarioModal={() => setIsSalarioModalOpen(true)}
        onOpenDespesaModal={() => setIsDespesaModalOpen(true)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        setToast={setToast} setError={setError}
      />

      <main className="flex-1 ml-72 p-6 flex flex-col overflow-hidden">
        <div className="w-[95%] mx-auto flex flex-col h-full">
          <Header 
            filterMonth={filterMonth} setFilterMonth={setFilterMonth} availableMonths={availableMonths}
            filterYear={filterYear} setFilterYear={setFilterYear} availableYears={availableYears}
            startDate={startDate} setStartDate={setStartDate} endDate={endDate} setEndDate={setEndDate}
            onResetConfirm={() => setIsResetConfirmOpen(true)}
            onDownloadBackup={() => window.location.href = '/api/backup'}
            onRestoreSelect={(file) => { setPendingRestoreFile(file); setIsRestoreConfirmOpen(true); }}
          />

          <div className="flex-1 flex gap-6 min-h-0">
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-6">
              <div className="min-h-full flex flex-col gap-4 justify-center">
                {hasRecords && (
                  <div className="w-full rounded-2xl bg-yellow-100 p-4 shadow-soft border-2 border-yellow-200 shrink-0">
                    <div className="mb-2 flex items-center gap-2 text-yellow-800"><TrendingUp size={20} /><h2 className="text-lg font-bold">Ajustes de Saldo</h2></div>
                    {balances.length > 0 ? (
                      <ul className="space-y-1">{balances.map((adj, i) => <li key={i} className="text-sm text-yellow-900 font-medium">• {adj}</li>)}</ul>
                    ) : <p className="text-sm text-yellow-800 italic">Tudo equilibrado!</p>}
                  </div>
                )}
                <div className="flex flex-col gap-4">
                  {personStats.map(p => <PersonCard key={p.id} person={p} formatCurrency={formatCurrency} onClick={() => { setSelectedPersonId(p.id); setIsPersonDetailModalOpen(true); }} />)}
                </div>
              </div>
            </div>
            <DashboardCharts hasRecords={hasRecords} pessoas={pessoas} chartPersonFilter={chartPersonFilter} setChartPersonFilter={setChartPersonFilter} barChartData={barChartData} pieChartData={pieChartData} />
          </div>

          <PessoaModal isOpen={isPessoaModalOpen} onClose={() => setIsPessoaModalOpen(false)} setToast={setToast} setError={setError} pessoas={pessoas} />
          <DespesaModal isOpen={isDespesaModalOpen} onClose={() => setIsDespesaModalOpen(false)} setToast={setToast} setError={setError} pessoas={pessoas} categorias={sortedCategorias} />
          <SalarioModal isOpen={isSalarioModalOpen} onClose={() => setIsSalarioModalOpen(false)} setToast={setToast} setError={setError} pessoas={pessoas} />
          <CategoriaModal isOpen={isCategoriaModalOpen} onClose={() => setIsCategoriaModalOpen(false)} setToast={setToast} setError={setError} categorias={sortedCategorias} />
          
          <ImportModal 
            isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} 
            pessoas={pessoas} importPessoaId={importPessoaId} setImportPessoaId={setImportPessoaId}
            importSource={importSource} setImportSource={setImportSource} onFileSelect={handleImportCSV}
          />

          <ReviewModal 
            isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} 
            reviewItems={reviewItems} setReviewItems={setReviewItems} pessoas={pessoas} onConfirm={handleConfirmImport}
          />

          <PersonDetailModal 
            isOpen={isPersonDetailModalOpen} onClose={() => setIsPersonDetailModalOpen(false)}
            selectedPersonDetails={selectedPersonDetails} pessoas={pessoas} sortedCategorias={sortedCategorias}
            personSearchTerm={personSearchTerm} setPersonSearchTerm={setPersonSearchTerm}
            summarySort={summarySort} setSummarySort={setSummarySort}
            onExport={() => setIsExportModalOpen(true)}
            onDeletePerson={(p) => { setPersonToDelete(p); setIsDeletePessoaModalOpen(true); }}
            onDeleteRecord={handleDeleteRecord} onUpdateValue={handleUpdateValue} onUpdateCategory={handleUpdateCategory}
          />

          <ExportModal 
            isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} 
            onExport={(opt) => handleExportData(opt, selectedPersonDetails, pessoas)}
            defaultFilenamePrefix={`Resumo_${(selectedPersonDetails?.person.nome || '').replace(/\s+/g, '_')}`}
          />

          <ConfirmModal
            isOpen={isDeletePessoaModalOpen} onClose={() => setIsDeletePessoaModalOpen(false)}
            onConfirm={handleDeletePessoa} title="Excluir Pessoa Permanentemente?"
            message={`ATENÇÃO: Esta ação é irreversível. Ao excluir ${personToDelete?.nome}, TODOS os registros associados serão apagados.`}
            confirmLabel="Sim, Excluir Tudo" cancelLabel="Não, Manter Dados" type="danger"
          />

          <ConfirmModal
            isOpen={isResetConfirmOpen} onClose={() => setIsResetConfirmOpen(false)}
            onConfirm={() => resetData.mutate(undefined, { onSuccess: () => setIsResetConfirmOpen(false) })}
            title="Limpar Todos os Dados?" message="Esta ação irá excluir permanentemente todas as pessoas, categorias, despesas e entradas."
            confirmLabel="Sim, Limpar Tudo" cancelLabel="Cancelar" type="danger"
          />

          <ConfirmModal
            isOpen={isRestoreConfirmOpen} onClose={() => setIsRestoreConfirmOpen(false)}
            onConfirm={handleRestoreBackup} title="Restaurar Banco de Dados?"
            message="Esta ação irá SUBSTITUIR COMPLETAMENTE todos os dados atuais pelo conteúdo do backup."
            confirmLabel="Substituir Tudo" cancelLabel="Cancelar" type="warning"
          />

          <ErrorModal isOpen={!!error} onClose={() => setError(null)} message={error || ''} />

          {toast && (
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="rounded-2xl bg-gray-900 px-6 py-3 text-white shadow-2xl flex items-center gap-3">
                <ClipboardCheck className="text-emerald-400" size={20} /><span className="font-medium">{toast}</span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
