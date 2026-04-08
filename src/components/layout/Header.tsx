import React from 'react';
import { Filter, X, Trash2, Download, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HeaderProps {
  filterMonth: number;
  setFilterMonth: (m: number) => void;
  availableMonths: number[];
  filterYear: number;
  setFilterYear: (y: number) => void;
  availableYears: number[];
  startDate: string;
  setStartDate: (d: string) => void;
  endDate: string;
  setEndDate: (d: string) => void;
  onResetConfirm: () => void;
  onDownloadBackup: () => void;
  onRestoreSelect: (file: File) => void;
}

export function Header({
  filterMonth, setFilterMonth, availableMonths,
  filterYear, setFilterYear, availableYears,
  startDate, setStartDate,
  endDate, setEndDate,
  onResetConfirm, onDownloadBackup, onRestoreSelect
}: HeaderProps) {
  return (
    <header className="mb-6 relative flex items-center justify-center min-h-[48px] shrink-0">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-2 px-4 shadow-soft border-soft">
        <div className="flex items-center gap-2">
          <Filter className="text-gray-400" size={18} />
          <select 
            value={filterMonth} 
            onChange={(e) => setFilterMonth(parseInt(e.target.value))}
            className="rounded-lg border-none bg-transparent px-2 py-1 outline-none text-sm font-medium text-gray-700 focus:ring-0"
          >
            <option value={-1}>Todos os Meses</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {format(new Date(2024, m), 'MMMM', { locale: ptBR })}
              </option>
            ))}
          </select>
          <div className="w-px h-4 bg-gray-200"></div>
          <select 
            value={filterYear} 
            onChange={(e) => setFilterYear(parseInt(e.target.value))}
            className="rounded-lg border-none bg-transparent px-2 py-1 outline-none text-sm font-medium text-gray-700 focus:ring-0"
          >
            <option value={-1}>Todos os Anos</option>
            {availableYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div className="w-px h-6 bg-gray-200 hidden md:block"></div>

        <div className="flex items-center gap-2">
          <input 
            type="date" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-lg border-none bg-gray-50 px-2 py-1 outline-none text-xs font-medium text-gray-700 focus:ring-2 focus:ring-indigo-500"
          />
          <span className="text-gray-400 text-xs">até</span>
          <input 
            type="date" 
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-lg border-none bg-gray-50 px-2 py-1 outline-none text-xs font-medium text-gray-700 focus:ring-2 focus:ring-indigo-500"
          />
          {(startDate || endDate || filterMonth !== -1 || filterYear !== -1) && (
            <button 
              onClick={() => { 
                setStartDate(''); 
                setEndDate(''); 
                setFilterMonth(-1);
                setFilterYear(-1);
              }}
              className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-red-500 transition-colors"
              title="Limpar Filtros"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="absolute right-0 flex items-center gap-2">
        <button
          onClick={onResetConfirm}
          className="p-2 rounded-xl bg-white shadow-soft border-soft text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
          title="Limpar Todos os Dados"
        >
          <Trash2 size={20} />
        </button>
        <button
          onClick={onDownloadBackup}
          className="p-2 rounded-xl bg-white shadow-soft border-soft text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
          title="Baixar Backup (.zip)"
        >
          <Download size={20} />
        </button>
        <label className="cursor-pointer p-2 rounded-xl bg-white shadow-soft border-soft text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 transition-all" title="Restaurar Backup (.zip)">
          <Upload size={20} />
          <input
            type="file"
            accept=".zip"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onRestoreSelect(file);
              }
              e.target.value = '';
            }}
          />
        </label>
      </div>
    </header>
  );
}
