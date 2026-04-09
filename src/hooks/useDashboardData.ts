import { useMemo } from 'react';
import { 
  format, parseISO, getMonth, getYear, eachDayOfInterval,
  differenceInDays, eachMonthOfInterval, eachYearOfInterval, isSameMonth, isSameYear,
  startOfDay, endOfDay, isWithinInterval
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Pessoa, Categoria, Despesa, Salario } from '../types';

interface DashboardDataProps {
  pessoas: Pessoa[];
  categorias: Categoria[];
  despesas: Despesa[];
  salarios: Salario[];
  auditLogs: any[];
  startDate: string;
  endDate: string;
  filterMonth: number;
  filterYear: number;
  chartPersonFilter: number;
  personSearchTerm: string;
  logSearchTerm: string;
  selectedPersonId: number | null;
  summarySort: { key: string; direction: 'asc' | 'desc' } | null;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const useDashboardData = ({
  pessoas,
  categorias,
  despesas,
  salarios,
  auditLogs,
  startDate,
  endDate,
  filterMonth,
  filterYear,
  chartPersonFilter,
  personSearchTerm,
  logSearchTerm,
  selectedPersonId,
  summarySort,
}: DashboardDataProps) => {

  const filteredDespesas = useMemo(() => {
    return despesas.filter(d => {
      const date = parseISO(d.data_pagamento);
      if (isNaN(date.getTime())) return true;
      const dateStr = d.data_pagamento;
      const m = getMonth(date);
      const y = getYear(date);

      const matchStart = !startDate || dateStr >= startDate;
      const matchEnd = !endDate || dateStr <= endDate;
      const matchMonth = filterMonth === -1 || m === filterMonth;
      const matchYear = filterYear === -1 || y === filterYear;

      return matchStart && matchEnd && matchMonth && matchYear;
    });
  }, [despesas, startDate, endDate, filterMonth, filterYear]);

  const filteredSalarios = useMemo(() => {
    return salarios.filter(s => {
      const date = parseISO(s.data_pagamento);
      if (isNaN(date.getTime())) return true;
      const dateStr = s.data_pagamento;
      const m = getMonth(date);
      const y = getYear(date);

      const matchStart = !startDate || dateStr >= startDate;
      const matchEnd = !endDate || dateStr <= endDate;
      const matchMonth = filterMonth === -1 || m === filterMonth;
      const matchYear = filterYear === -1 || y === filterYear;

      return matchStart && matchEnd && matchMonth && matchYear;
    });
  }, [salarios, startDate, endDate, filterMonth, filterYear]);

  const hasRecords = filteredDespesas.length > 0 || filteredSalarios.length > 0;

  const balances = useMemo(() => {
    if (pessoas.length === 0) return [];
    const netBalancesMap = pessoas.reduce((acc, p) => {
      acc[p.id] = 0;
      return acc;
    }, {} as Record<number, number>);

    filteredDespesas.forEach(d => {
      if (d.destino === 'Dividir') {
        const share = d.valor / pessoas.length;
        pessoas.forEach(p => {
          if (p.id === d.origem_id) {
            netBalancesMap[p.id] += (d.valor - share);
          } else {
            netBalancesMap[p.id] -= share;
          }
        });
      } else {
        const destId = parseInt(d.destino);
        if (!isNaN(destId)) {
          if (netBalancesMap[d.origem_id] !== undefined) netBalancesMap[d.origem_id] += d.valor;
          if (netBalancesMap[destId] !== undefined) netBalancesMap[destId] -= d.valor;
        }
      }
    });

    const netBalances = pessoas.map(p => ({
      id: p.id,
      nome: p.nome,
      balance: netBalancesMap[p.id]
    }));

    const debtors = netBalances.filter(b => b.balance < -0.01).sort((a, b) => a.balance - b.balance);
    const creditors = netBalances.filter(b => b.balance > 0.01).sort((a, b) => b.balance - a.balance);

    const adjustments: string[] = [];
    const tempDebtors = debtors.map(d => ({ ...d, balance: Math.abs(d.balance) }));
    const tempCreditors = creditors.map(c => ({ ...c }));

    let dIdx = 0;
    let cIdx = 0;

    while (dIdx < tempDebtors.length && cIdx < tempCreditors.length) {
      const debtor = tempDebtors[dIdx];
      const creditor = tempCreditors[cIdx];
      const amount = Math.min(debtor.balance, creditor.balance);

      if (amount > 0.01) {
        adjustments.push(`${debtor.nome} paga ${formatCurrency(amount)} para ${creditor.nome}`);
      }

      debtor.balance -= amount;
      creditor.balance -= amount;
      if (debtor.balance < 0.01) dIdx++;
      if (creditor.balance < 0.01) cIdx++;
    }

    return adjustments;
  }, [pessoas, filteredDespesas]);

  const personStats = useMemo(() => {
    return pessoas.map(p => {
      const totalSpent = filteredDespesas
        .filter(d => d.origem_id === p.id)
        .reduce((sum, d) => sum + d.valor, 0);
      
      const totalSalary = filteredSalarios
        .filter(s => s.recebedor_id === p.id)
        .reduce((sum, s) => sum + s.valor, 0);

      return { ...p, totalSpent, totalSalary };
    });
  }, [pessoas, filteredDespesas, filteredSalarios]);

  const selectedPersonDetails = useMemo(() => {
    if (selectedPersonId === null) return null;
    const person = pessoas.find(p => p.id === selectedPersonId);
    if (!person) return null;

    const pDespesas = filteredDespesas.filter(d => d.origem_id === selectedPersonId);
    const pSalarios = filteredSalarios.filter(s => s.recebedor_id === selectedPersonId);

    let movements = [
      ...pDespesas.map(d => {
        const dateObj = parseISO(d.data_pagamento);
        const isValidDate = !isNaN(dateObj.getTime());
        return { 
          ...d, 
          id: `despesa-${d.id}`,
          tipo: 'Saída', 
          displayData: d.data_pagamento,
          data_compra: d.data_compra || d.data_pagamento,
          formattedDate: isValidDate ? format(dateObj, 'dd/MM/yyyy') : d.data_pagamento,
          formattedCompraDate: d.data_compra ? format(parseISO(d.data_compra), 'dd/MM/yyyy') : (isValidDate ? format(dateObj, 'dd/MM/yyyy') : d.data_pagamento),
          monthName: isValidDate ? format(dateObj, 'MMMM', { locale: ptBR }) : '',
          monthNameShort: isValidDate ? format(dateObj, 'MMM', { locale: ptBR }) : ''
        };
      }),
      ...pSalarios.map(s => {
        const dateObj = parseISO(s.data_pagamento);
        const isValidDate = !isNaN(dateObj.getTime());
        return { 
          ...s, 
          id: `salario-${s.id}`,
          tipo: 'Entrada', 
          displayData: s.data_pagamento,
          data_compra: s.data_pagamento,
          formattedDate: isValidDate ? format(dateObj, 'dd/MM/yyyy') : s.data_pagamento,
          formattedCompraDate: isValidDate ? format(dateObj, 'dd/MM/yyyy') : s.data_pagamento,
          monthName: isValidDate ? format(dateObj, 'MMMM', { locale: ptBR }) : '',
          monthNameShort: isValidDate ? format(dateObj, 'MMM', { locale: ptBR }) : ''
        };
      })
    ];

    if (summarySort) {
      const { key, direction } = summarySort;
      movements.sort((a, b) => {
        let valA: any = '';
        let valB: any = '';

        switch (key) {
          case 'data_compra':
            valA = a.data_compra || a.data_pagamento || '';
            valB = b.data_compra || b.data_pagamento || '';
            break;
          case 'data_pagto':
            valA = a.data_pagamento || '';
            valB = b.data_pagamento || '';
            break;
          case 'descricao':
            valA = (a.descricao || '').toLowerCase();
            valB = (b.descricao || '').toLowerCase();
            break;
          case 'categoria':
            valA = (a.categoria_nome || (a.tipo === 'Entrada' ? 'Entrada' : '')).toLowerCase();
            valB = (b.categoria_nome || (b.tipo === 'Entrada' ? 'Entrada' : '')).toLowerCase();
            break;
          case 'destino':
            const getDestName = (m: any) => {
              if (m.tipo === 'Entrada') return '-';
              if (m.destino === 'Dividir' || m.destino === 'Dividido') return 'Dividir';
              const p = pessoas.find(p => p.id === Number(m.destino));
              return p ? p.nome : (m.destino || '-');
            };
            valA = getDestName(a).toLowerCase();
            valB = getDestName(b).toLowerCase();
            break;
          case 'valor':
            valA = a.valor;
            valB = b.valor;
            break;
          case 'tipo':
            valA = a.tipo.toLowerCase();
            valB = b.tipo.toLowerCase();
            break;
          default:
            valA = a.displayData;
            valB = b.displayData;
        }

        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      movements.sort((a, b) => b.displayData.localeCompare(a.displayData));
    }

    if (personSearchTerm) {
      const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const term = normalize(personSearchTerm).trim();
      const numericTerm = term.replace(',', '.');

      movements = movements.filter(m => {
        const valorStr = m.valor.toString();
        const valorFixed = m.valor.toFixed(2);
        const valorFormatted = formatCurrency(m.valor).toLowerCase();

        let destinoName = '-';
        if (m.tipo === 'Saída') {
          if (m.destino === 'Dividir' || m.destino === 'Dividido') {
            destinoName = 'Dividir';
          } else {
            const p = pessoas.find(p => p.id === Number(m.destino));
            destinoName = p ? p.nome : (m.destino || '-');
          }
        }

        return normalize(m.descricao).includes(term) ||
          (m.categoria_nome && normalize(m.categoria_nome).includes(term)) ||
          normalize(destinoName).includes(term) ||
          valorStr.includes(term) ||
          valorStr.includes(numericTerm) ||
          valorFixed.includes(term) ||
          valorFixed.includes(numericTerm) ||
          valorFixed.replace('.', ',').includes(term) ||
          valorFormatted.includes(term) ||
          m.formattedDate.includes(term) ||
          (m.data_compra && m.data_compra.includes(term)) ||
          (m.formattedCompraDate && m.formattedCompraDate.includes(term)) ||
          normalize(m.tipo).includes(term) ||
          normalize(m.monthName).includes(term) ||
          normalize(m.monthNameShort).includes(term);
      });
    }

    const totalSpent = pDespesas.reduce((sum, d) => sum + d.valor, 0);
    const exclusiveSpent = pDespesas.filter(d => d.destino !== 'Dividir').reduce((sum, d) => sum + d.valor, 0);
    const sharedSpent = pDespesas.filter(d => d.destino === 'Dividir').reduce((sum, d) => sum + d.valor, 0);
    const totalSalary = pSalarios.reduce((sum, s) => sum + s.valor, 0);

    return {
      person,
      movements,
      totalSpent,
      exclusiveSpent,
      sharedSpent,
      totalSalary,
      net: totalSalary - totalSpent
    };
  }, [selectedPersonId, pessoas, filteredDespesas, filteredSalarios, personSearchTerm, summarySort]);

  const barChartData = useMemo(() => {
    const chartDespesas = chartPersonFilter === -1 
      ? filteredDespesas 
      : filteredDespesas.filter(d => d.origem_id === chartPersonFilter);
    
    const chartSalarios = chartPersonFilter === -1
      ? filteredSalarios
      : filteredSalarios.filter(s => s.recebedor_id === chartPersonFilter);

    const items = [
      ...chartDespesas.map(d => ({ ...d, data: d.data_pagamento })),
      ...chartSalarios.map(s => ({ ...s, data: s.data_pagamento }))
    ];
    if (items.length === 0) return [];

    let start: Date;
    let end: Date;

    if (startDate && endDate) {
      start = parseISO(startDate);
      end = parseISO(endDate);
    } else if (startDate) {
      start = parseISO(startDate);
      const dates = items.map(i => parseISO(i.data)).filter(d => !isNaN(d.getTime()));
      end = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : new Date();
    } else if (endDate) {
      end = parseISO(endDate);
      const dates = items.map(i => parseISO(i.data)).filter(d => !isNaN(d.getTime()));
      start = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : new Date();
    } else {
      const dates = items.map(i => parseISO(i.data)).filter(d => !isNaN(d.getTime()));
      if (dates.length === 0) return [];
      start = new Date(Math.min(...dates.map(d => d.getTime())));
      end = new Date(Math.max(...dates.map(d => d.getTime())));
    }

    if (start > end) [start, end] = [end, start];
    const diffDays = differenceInDays(end, start);

    if (diffDays <= 62) {
      const days = eachDayOfInterval({ start, end });
      return days.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayDespesas = chartDespesas.filter(d => d.data_pagamento === dayStr);
        const data: any = { day: format(day, 'dd/MM') };
        pessoas.forEach(p => {
          data[p.nome] = dayDespesas
            .filter(d => d.origem_id === p.id && d.destino !== 'Dividir')
            .reduce((sum, d) => sum + d.valor, 0);
        });
        data['Dividir'] = dayDespesas
            .filter(d => d.destino === 'Dividir')
            .reduce((sum, d) => sum + d.valor, 0);
        return data;
      });
    } else if (diffDays <= 365 * 2) {
      const months = eachMonthOfInterval({ start, end });
      return months.map(month => {
        const monthDespesas = chartDespesas.filter(d => isSameMonth(parseISO(d.data_pagamento), month));
        const data: any = { day: format(month, 'MMM/yy', { locale: ptBR }) };
        pessoas.forEach(p => {
          data[p.nome] = monthDespesas
            .filter(d => d.origem_id === p.id && d.destino !== 'Dividir')
            .reduce((sum, d) => sum + d.valor, 0);
        });
        data['Dividir'] = monthDespesas
          .filter(d => d.destino === 'Dividir')
          .reduce((sum, d) => sum + d.valor, 0);
        return data;
      });
    } else {
      const years = eachYearOfInterval({ start, end });
      return years.map(year => {
        const yearDespesas = chartDespesas.filter(d => isSameYear(parseISO(d.data_pagamento), year));
        const data: any = { day: format(year, 'yyyy') };
        pessoas.forEach(p => {
          data[p.nome] = yearDespesas
            .filter(d => d.origem_id === p.id && d.destino !== 'Dividir')
            .reduce((sum, d) => sum + d.valor, 0);
        });
        data['Dividir'] = yearDespesas
          .filter(d => d.destino === 'Dividir')
          .reduce((sum, d) => sum + d.valor, 0);
        return data;
      });
    }
  }, [pessoas, filteredDespesas, filteredSalarios, startDate, endDate, chartPersonFilter]);

  const pieChartData = useMemo(() => {
    const chartDespesas = chartPersonFilter === -1 
      ? filteredDespesas 
      : filteredDespesas.filter(d => d.origem_id === chartPersonFilter);

    return categorias.map(c => {
      const total = chartDespesas
        .filter(d => d.categoria_id === c.id)
        .reduce((sum, d) => sum + d.valor, 0);
      return { name: c.nome, value: total };
    }).filter(c => c.value > 0).sort((a, b) => b.value - a.value);
  }, [categorias, filteredDespesas, chartPersonFilter]);

  const allMovements = useMemo(() => {
    const initialLogsMap = new Map();
    auditLogs.forEach(l => {
      if (l.descricao.includes('Lançamento inicial:')) {
        initialLogsMap.set(`${l.tipo}-${l.registro_id}`, l);
      }
    });

    const matchesFilters = (dateStr: string) => {
      const dDate = parseISO(dateStr);
      if (isNaN(dDate.getTime())) return false;
      
      if (startDate && endDate) {
        const start = startOfDay(parseISO(startDate));
        const end = endOfDay(parseISO(endDate));
        return isWithinInterval(dDate, { start, end });
      }
      
      const m = getMonth(dDate) + 1;
      const y = getYear(dDate);
      return m === filterMonth && y === filterYear;
    };

    const mDespesas = despesas.filter(d => matchesFilters(d.data_pagamento)).map(d => {
      let destinoLabel = d.destino;
      if (d.destino !== 'Dividir') {
        const p = pessoas.find(p => Number(p.id) === Number(d.destino));
        destinoLabel = p ? p.nome : d.destino;
      }
      const dateObj = parseISO(d.data_pagamento);
      const isValidDate = !isNaN(dateObj.getTime());
      const initialLog = initialLogsMap.get(`Despesa-${d.id}`);
      const initialValor = initialLog ? initialLog.valor_novo : d.valor;
      
      return {
        id: `d-${d.id}`,
        data: d.data_pagamento,
        data_compra: d.data_compra || d.data_pagamento,
        data_pagamento: d.data_pagamento,
        dateObj,
        isValidDate,
        formattedDate: isValidDate ? format(dateObj, 'dd/MM/yyyy') : d.data_pagamento,
        formattedCompraDate: d.data_compra ? format(parseISO(d.data_compra), 'dd/MM/yyyy') : (isValidDate ? format(dateObj, 'dd/MM/yyyy') : d.data_pagamento),
        month: isValidDate ? getMonth(dateObj) + 1 : 0,
        monthName: isValidDate ? format(dateObj, 'MMMM', { locale: ptBR }) : '',
        monthNameShort: isValidDate ? format(dateObj, 'MMM', { locale: ptBR }) : '',
        year: isValidDate ? getYear(dateObj).toString() : '',
        descricao: d.descricao || 'Despesa',
        categoria: d.categoria_nome || '-',
        valor: d.valor, 
        originalValor: initialValor,
        tipo: 'Saída',
        pessoa: d.origem_nome || '-',
        destino: destinoLabel,
        dbId: d.id,
        raw: d
      };
    });

    const mSalarios = salarios.filter(s => matchesFilters(s.data_pagamento)).map(s => {
      const dateObj = parseISO(s.data_pagamento);
      const isValidDate = !isNaN(dateObj.getTime());
      const initialLog = initialLogsMap.get(`Entrada-${s.id}`);
      const initialValor = initialLog ? initialLog.valor_novo : s.valor;
      
      return {
        id: `s-${s.id}`,
        data: s.data_pagamento,
        data_compra: s.data_pagamento,
        data_pagamento: s.data_pagamento,
        dateObj,
        isValidDate,
        formattedDate: isValidDate ? format(dateObj, 'dd/MM/yyyy') : s.data_pagamento,
        formattedCompraDate: isValidDate ? format(dateObj, 'dd/MM/yyyy') : s.data_pagamento,
        month: isValidDate ? getMonth(dateObj) + 1 : 0,
        monthName: isValidDate ? format(dateObj, 'MMMM', { locale: ptBR }) : '',
        monthNameShort: isValidDate ? format(dateObj, 'MMM', { locale: ptBR }) : '',
        year: isValidDate ? getYear(dateObj).toString() : '',
        descricao: s.descricao || 'Entrada',
        categoria: 'Entrada',
        valor: s.valor, 
        originalValor: initialValor,
        tipo: 'Entrada',
        pessoa: '-',
        destino: s.recebedor_nome || '-',
        dbId: s.id,
        raw: s
      };
    });

    const currentDespesaIds = new Set(despesas.map(d => Number(d.id)));
    const currentSalarioIds = new Set(salarios.map(s => Number(s.id)));

    const deletedLogs = auditLogs.filter(l => {
      if (!l.descricao.includes('Lançamento inicial:')) return false;
      if (l.tipo === 'Despesa' && currentDespesaIds.has(Number(l.registro_id))) return false;
      if (l.tipo === 'Entrada' && currentSalarioIds.has(Number(l.registro_id))) return false;
      const dateStr = l.data_registro || l.timestamp.split('T')[0];
      return matchesFilters(dateStr);
    });

    const mDeleted = deletedLogs.map(l => {
      const dateStr = l.data_registro || l.timestamp.split('T')[0];
      const dateObj = parseISO(dateStr);
      const isValidDate = !isNaN(dateObj.getTime());
      let destinoLabel = l.destino || '-';
      if (l.tipo === 'Despesa' && l.destino && l.destino !== 'Dividir') {
        const p = pessoas.find(p => Number(p.id) === Number(l.destino));
        if (p) destinoLabel = p.nome;
      }
      const cleanDesc = l.descricao.split('Lançamento inicial: ')[1] || l.descricao;
      return {
        id: `${l.tipo === 'Despesa' ? 'd' : 's'}-${l.registro_id}`,
        data: dateStr,
        data_compra: dateStr,
        data_pagamento: dateStr,
        dateObj,
        isValidDate,
        formattedDate: isValidDate ? format(dateObj, 'dd/MM/yyyy') : dateStr,
        formattedCompraDate: isValidDate ? format(dateObj, 'dd/MM/yyyy') : dateStr,
        month: isValidDate ? getMonth(dateObj) + 1 : 0,
        monthName: isValidDate ? format(dateObj, 'MMMM', { locale: ptBR }) : '',
        monthNameShort: isValidDate ? format(dateObj, 'MMM', { locale: ptBR }) : '',
        year: isValidDate ? getYear(dateObj).toString() : '',
        descricao: cleanDesc + ' (Excluído)',
        categoria: l.categoria_nome || (l.tipo === 'Entrada' ? 'Entrada' : '-'),
        valor: l.valor_novo,
        originalValor: l.valor_novo,
        tipo: l.tipo === 'Despesa' ? 'Saída' : 'Entrada',
        pessoa: l.pessoa_nome || '-',
        destino: destinoLabel,
        dbId: l.registro_id,
        raw: l
      };
    });

    const mOther = auditLogs.filter(l => {
      if (l.tipo !== 'Pessoa' && l.tipo !== 'Categoria') return false;
      const dateStr = l.timestamp.split('T')[0];
      return matchesFilters(dateStr);
    }).map(l => {
      const dateStr = l.timestamp.split('T')[0];
      const dateObj = parseISO(dateStr);
      const isValidDate = !isNaN(dateObj.getTime());
      return {
        id: `${l.tipo === 'Pessoa' ? 'p' : 'c'}-${l.registro_id}`,
        data: dateStr,
        data_compra: dateStr,
        data_pagamento: dateStr,
        dateObj,
        isValidDate,
        formattedDate: isValidDate ? format(dateObj, 'dd/MM/yyyy') : dateStr,
        formattedCompraDate: isValidDate ? format(dateObj, 'dd/MM/yyyy') : dateStr,
        month: isValidDate ? getMonth(dateObj) + 1 : 0,
        monthName: isValidDate ? format(dateObj, 'MMMM', { locale: ptBR }) : '',
        monthNameShort: isValidDate ? format(dateObj, 'MMM', { locale: ptBR }) : '',
        year: isValidDate ? getYear(dateObj).toString() : '',
        descricao: l.descricao,
        categoria: l.tipo,
        valor: 0,
        originalValor: 0,
        tipo: 'Atividade',
        pessoa: l.tipo === 'Pessoa' ? l.descricao.replace('Nova Pessoa: ', '') : '-',
        destino: '-',
        dbId: l.registro_id,
        raw: l
      };
    });

    return [...mDespesas, ...mSalarios, ...mDeleted, ...mOther].sort((a, b) => {
      const dateComp = b.data.localeCompare(a.data);
      if (dateComp !== 0) return dateComp;
      return Number(b.dbId) - Number(a.dbId);
    });
  }, [despesas, salarios, auditLogs, pessoas, filterMonth, filterYear, startDate, endDate]);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    despesas.forEach(d => {
      const date = parseISO(d.data_pagamento);
      if (!isNaN(date.getTime())) years.add(getYear(date));
    });
    salarios.forEach(s => {
      const date = parseISO(s.data_pagamento);
      if (!isNaN(date.getTime())) years.add(getYear(date));
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [despesas, salarios]);

  const availableMonths = useMemo(() => {
    const months = new Set<number>();
    const items = [
      ...despesas.map(d => ({ data: d.data_pagamento })),
      ...salarios.map(s => ({ data: s.data_pagamento }))
    ];
    items.forEach(item => {
      const date = parseISO(item.data);
      if (!isNaN(date.getTime())) {
        if (filterYear === -1 || getYear(date) === filterYear) {
          months.add(getMonth(date));
        }
      }
    });
    return Array.from(months).sort((a, b) => a - b);
  }, [despesas, salarios, filterYear]);

  const filteredMovements = useMemo(() => {
    let result = [...allMovements];
    if (logSearchTerm) {
      const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const term = normalize(logSearchTerm).trim();
      const numericTerm = term.replace(',', '.');
      const monthYearRegex = /^(\d{1,2})\s*[\/\-]\s*(\d{2,4})$/;
      const myMatch = term.match(monthYearRegex);
      
      result = result.filter(m => {
        const prefix = m.id.startsWith('d-') ? 'S' : 
                       m.id.startsWith('s-') ? 'E' : 
                       m.id.startsWith('p-') ? 'P' : 'C';
        const prefixedId = prefix + m.dbId;
        if (myMatch && m.isValidDate) {
          const searchMonth = parseInt(myMatch[1]);
          const searchYear = myMatch[2];
          const monthMatches = m.month === searchMonth;
          const yearMatches = searchYear.length === 2 ? m.year.endsWith(searchYear) : m.year === searchYear;
          if (monthMatches && yearMatches) return true;
        }
        return normalize(m.descricao).includes(term) ||
          normalize(m.categoria).includes(term) ||
          normalize(m.pessoa).includes(term) ||
          normalize(m.destino).includes(term) ||
          m.valor.toString().includes(term) ||
          m.valor.toString().includes(numericTerm) ||
          m.valor.toFixed(2).includes(term) ||
          m.valor.toFixed(2).includes(numericTerm) ||
          m.valor.toFixed(2).replace('.', ',').includes(term) ||
          formatCurrency(m.valor).toLowerCase().includes(term) ||
          m.formattedDate.includes(term) ||
          m.data.includes(term) ||
          normalize(m.tipo).includes(term) ||
          normalize(m.monthName || '').includes(term) ||
          normalize(m.monthNameShort || '').includes(term) ||
          prefixedId.toLowerCase().includes(term);
      });
    }
    return result;
  }, [allMovements, logSearchTerm]);

  return {
    filteredDespesas,
    filteredSalarios,
    hasRecords,
    balances,
    personStats,
    selectedPersonDetails,
    barChartData,
    pieChartData,
    allMovements,
    filteredMovements,
    availableYears,
    availableMonths
  };
};
