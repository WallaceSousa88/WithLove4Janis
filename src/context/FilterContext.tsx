import React, { createContext, useContext, useState, ReactNode } from "react";
import { format } from "date-fns";

interface FilterContextType {
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  filterMonth: number;
  setFilterMonth: (month: number) => void;
  filterYear: number;
  setFilterYear: (year: number) => void;
  
  chartPersonFilter: number | -1;
  setChartPersonFilter: (val: number | -1) => void;
  personSearchTerm: string;
  setPersonSearchTerm: (term: string) => void;
  logSearchTerm: string;
  setLogSearchTerm: (term: string) => void;
  selectedPersonId: number | null;
  setSelectedPersonId: (id: number | null) => void;
  isPersonDetailModalOpen: boolean;
  setIsPersonDetailModalOpen: (open: boolean) => void;
  
  importPessoaId: string;
  setImportPessoaId: (id: string) => void;
  logSort: { key: string; direction: 'asc' | 'desc' } | null;
  setLogSort: (sort: { key: string; direction: 'asc' | 'desc' } | null) => void;
  reviewSearchTerm: string;
  setReviewSearchTerm: (term: string) => void;

  toast: string | null;
  setToast: (msg: string | null) => void;
  error: string | null;
  setError: (err: string | null) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider = ({ children }: { children: ReactNode }) => {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [filterMonth, setFilterMonth] = useState<number>(-1);
  const [filterYear, setFilterYear] = useState<number>(-1);

  const [chartPersonFilter, setChartPersonFilter] = useState<number | -1>(-1);
  const [personSearchTerm, setPersonSearchTerm] = useState('');
  const [logSearchTerm, setLogSearchTerm] = useState('');
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null);
  const [isPersonDetailModalOpen, setIsPersonDetailModalOpen] = useState(false);

  const [importPessoaId, setImportPessoaId] = useState<string>('');
  const [logSort, setLogSort] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [reviewSearchTerm, setReviewSearchTerm] = useState('');

  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-hide toast
  React.useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  return (
    <FilterContext.Provider value={{
      startDate, setStartDate,
      endDate, setEndDate,
      filterMonth, setFilterMonth,
      filterYear, setFilterYear,
      chartPersonFilter, setChartPersonFilter,
      personSearchTerm, setPersonSearchTerm,
      logSearchTerm, setLogSearchTerm,
      selectedPersonId, setSelectedPersonId,
      isPersonDetailModalOpen, setIsPersonDetailModalOpen,
      importPessoaId, setImportPessoaId,
      logSort, setLogSort,
      reviewSearchTerm, setReviewSearchTerm,
      toast, setToast,
      error, setError
    }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (!context) throw new Error("useFilters must be used within a FilterProvider");
  return context;
};
