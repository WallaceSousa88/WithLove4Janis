import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Filter, Users, DollarSign, CreditCard, Tag, TrendingUp, ChevronDown } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Sector
} from 'recharts';
import { format, parseISO, getMonth, getYear, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Pessoa, Categoria, Despesa, Salario, PALETTES } from './types';
import { Modal } from './components/Modal';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="font-bold">
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333" fontSize={12}>{`${payload.name} - ${(percent * 100).toFixed(0)}%`}</text>
    </g>
  );
};

export default function App() {
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [salarios, setSalarios] = useState<Salario[]>([]);

  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth());
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());

  const [isPessoaModalOpen, setIsPessoaModalOpen] = useState(false);
  const [isDespesaModalOpen, setIsDespesaModalOpen] = useState(false);
  const [isSalarioModalOpen, setIsSalarioModalOpen] = useState(false);
  const [isCategoriaModalOpen, setIsCategoriaModalOpen] = useState(false);

  const [activePieIndex, setActivePieIndex] = useState(0);

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  // Form states
  const [newPessoa, setNewPessoa] = useState({ nome: '', cor: '' });
  const [newDespesa, setNewDespesa] = useState({ data: format(new Date(), 'yyyy-MM-dd'), valor: '', origem_id: '', destino: 'Dividir', categoria_id: '' });
  const [newSalario, setNewSalario] = useState({ data: format(new Date(), 'yyyy-MM-dd'), valor: '', recebedor_id: '' });
  const [newCategoria, setNewCategoria] = useState({ nome: '' });

  const fetchData = async () => {
    const [p, c, d, s] = await Promise.all([
      fetch('/api/pessoas').then(res => res.json()),
      fetch('/api/categorias').then(res => res.json()),
      fetch('/api/despesas').then(res => res.json()),
      fetch('/api/salarios').then(res => res.json()),
    ]);
    setPessoas(p);
    setCategorias(c);
    setDespesas(d);
    setSalarios(s);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredDespesas = useMemo(() => {
    return despesas.filter(d => {
      const date = parseISO(d.data);
      return getMonth(date) === filterMonth && getYear(date) === filterYear;
    });
  }, [despesas, filterMonth, filterYear]);

  const filteredSalarios = useMemo(() => {
    return salarios.filter(s => {
      const date = parseISO(s.data);
      return getMonth(date) === filterMonth && getYear(date) === filterYear;
    });
  }, [salarios, filterMonth, filterYear]);

  const balances = useMemo(() => {
    if (pessoas.length === 0) return [];

    // Calculate net balance for each person
    // Balance = (What I paid for others) - (What others paid for me)
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
          // Origem paid for Destino
          if (netBalancesMap[d.origem_id] !== undefined) {
            netBalancesMap[d.origem_id] += d.valor;
          }
          if (netBalancesMap[destId] !== undefined) {
            netBalancesMap[destId] -= d.valor;
          }
        }
      }
    });

    const netBalances = pessoas.map(p => ({
      id: p.id,
      nome: p.nome,
      balance: netBalancesMap[p.id]
    }));

    // Calculate adjustments
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
        adjustments.push(`${debtor.nome} paga R$ ${amount.toFixed(2)} para ${creditor.nome}`);
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

  const barChartData = useMemo(() => {
    const days = eachDayOfInterval({
      start: startOfMonth(new Date(filterYear, filterMonth)),
      end: endOfMonth(new Date(filterYear, filterMonth))
    });

    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayDespesas = filteredDespesas.filter(d => d.data === dayStr);
      
      const data: any = { day: format(day, 'dd') };
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
  }, [pessoas, filteredDespesas, filterMonth, filterYear]);

  const pieChartData = useMemo(() => {
    const catTotals = categorias.map(c => {
      const total = filteredDespesas
        .filter(d => d.categoria_id === c.id)
        .reduce((sum, d) => sum + d.valor, 0);
      return { name: c.nome, value: total };
    }).filter(c => c.value > 0).sort((a, b) => b.value - a.value);

    return catTotals;
  }, [categorias, filteredDespesas]);

  const handleAddPessoa = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/pessoas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPessoa),
    });
    setNewPessoa({ nome: '', cor: '' });
    setIsPessoaModalOpen(false);
    fetchData();
  };

  const handleAddDespesa = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/despesas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newDespesa, valor: parseFloat(newDespesa.valor), origem_id: parseInt(newDespesa.origem_id), categoria_id: parseInt(newDespesa.categoria_id) }),
    });
    setNewDespesa({ data: format(new Date(), 'yyyy-MM-dd'), valor: '', origem_id: '', destino: 'Dividir', categoria_id: '' });
    setIsDespesaModalOpen(false);
    fetchData();
  };

  const handleAddSalario = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/salarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newSalario, valor: parseFloat(newSalario.valor), recebedor_id: parseInt(newSalario.recebedor_id) }),
    });
    setNewSalario({ data: format(new Date(), 'yyyy-MM-dd'), valor: '', recebedor_id: '' });
    setIsSalarioModalOpen(false);
    fetchData();
  };

  const handleAddCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/categorias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCategoria),
    });
    setNewCategoria({ nome: '' });
    setIsCategoriaModalOpen(false);
    fetchData();
  };

  const getNextAvailableColor = () => {
    const usedColors = pessoas.map(p => p.cor);
    for (const palette of PALETTES) {
      for (const color of palette.colors) {
        if (!usedColors.includes(color)) return color;
      }
    }
    return PALETTES[0].colors[0];
  };

  useEffect(() => {
    if (isPessoaModalOpen && !newPessoa.cor) {
      setNewPessoa(prev => ({ ...prev, cor: getNextAvailableColor() }));
    }
  }, [isPessoaModalOpen]);

  return (
    <div className="mx-auto w-[95%] max-w-7xl py-8">
      <header className="mb-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Controle Financeiro</h1>
        
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setIsPessoaModalOpen(true)} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-white shadow-soft hover:bg-indigo-700 transition-colors">
            <Users size={18} /> Adicionar Pessoa
          </button>
          <button onClick={() => setIsDespesaModalOpen(true)} className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-white shadow-soft hover:bg-rose-700 transition-colors">
            <CreditCard size={18} /> Adicionar Despesa
          </button>
          <button onClick={() => setIsSalarioModalOpen(true)} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-white shadow-soft hover:bg-emerald-700 transition-colors">
            <DollarSign size={18} /> Adicionar Salário
          </button>
          <button onClick={() => setIsCategoriaModalOpen(true)} className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-white shadow-soft hover:bg-amber-700 transition-colors">
            <Tag size={18} /> Adicionar Categoria
          </button>
          <button onClick={() => setIsLogModalOpen(true)} className="flex items-center gap-2 rounded-xl bg-gray-600 px-4 py-2 text-white shadow-soft hover:bg-gray-700 transition-colors">
            <TrendingUp size={18} /> Log de Atividades
          </button>
        </div>
      </header>

      <div className="mb-8 flex items-center gap-4 rounded-2xl bg-white p-4 shadow-soft border-soft">
        <Filter className="text-gray-400" size={20} />
        <select 
          value={filterMonth} 
          onChange={(e) => setFilterMonth(parseInt(e.target.value))}
          className="rounded-lg border-gray-200 bg-gray-50 px-3 py-1 outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <option key={i} value={i}>
              {format(new Date(2024, i), 'MMMM', { locale: ptBR })}
            </option>
          ))}
        </select>
        <select 
          value={filterYear} 
          onChange={(e) => setFilterYear(parseInt(e.target.value))}
          className="rounded-lg border-gray-200 bg-gray-50 px-3 py-1 outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {[2023, 2024, 2025, 2026].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Yellow Balance Card */}
      <div className="mb-8 rounded-2xl bg-yellow-100 p-6 shadow-soft border-2 border-yellow-200">
        <div className="mb-4 flex items-center gap-2 text-yellow-800">
          <TrendingUp size={24} />
          <h2 className="text-xl font-bold">Ajustes de Saldo</h2>
        </div>
        {balances.length > 0 ? (
          <ul className="space-y-2">
            {balances.map((adj, i) => (
              <li key={i} className="text-lg text-yellow-900 font-medium">• {adj}</li>
            ))}
          </ul>
        ) : (
          <p className="text-yellow-800 italic">Tudo equilibrado! Ninguém deve ninguém.</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Person Cards */}
        {personStats.map(p => (
          <div key={p.id} className="rounded-2xl bg-white p-6 shadow-soft border-soft overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: p.cor }}></div>
            <h3 className="mb-4 text-xl font-bold" style={{ color: p.cor }}>{p.nome}</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Total Gasto:</span>
                <span className="font-bold text-rose-600">R$ {p.totalSpent.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Salário Recebido:</span>
                <span className="font-bold text-emerald-600">R$ {p.totalSalary.toFixed(2)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Bar Chart */}
        <div className="rounded-2xl bg-white p-6 shadow-soft border-soft">
          <h3 className="mb-6 text-xl font-bold text-gray-800">Gastos Diários</h3>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f3f4f6' }}
                />
                {pessoas.map(p => (
                  <Bar key={p.id} dataKey={p.nome} stackId="a" fill={p.cor} radius={[0, 0, 0, 0]} />
                ))}
                <Bar dataKey="Dividir" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="rounded-2xl bg-white p-6 shadow-soft border-soft">
          <h3 className="mb-6 text-xl font-bold text-gray-800">Gastos por Categoria</h3>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  activeIndex={activePieIndex}
                  activeShape={renderActiveShape}
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  onMouseEnter={(_, index) => setActivePieIndex(index)}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PALETTES[0].colors[index % PALETTES[0].colors.length]} stroke="#fff" strokeWidth={2} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal isOpen={isPessoaModalOpen} onClose={() => setIsPessoaModalOpen(false)} title="Adicionar Pessoa">
        <form onSubmit={handleAddPessoa} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome</label>
            <input 
              type="text" 
              required
              value={newPessoa.nome}
              onChange={e => setNewPessoa(prev => ({ ...prev, nome: e.target.value }))}
              className="mt-1 w-full rounded-xl border-gray-200 bg-gray-50 p-3 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Cor</label>
            <div className="mt-2 grid grid-cols-5 gap-2">
              {PALETTES.flatMap(p => p.colors).map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewPessoa(prev => ({ ...prev, cor: c }))}
                  className={cn(
                    "h-8 w-8 rounded-full border-2 transition-transform hover:scale-110",
                    newPessoa.cor === c ? "border-gray-900 scale-110" : "border-transparent"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <button type="submit" className="w-full rounded-xl bg-indigo-600 py-3 text-white font-bold shadow-soft hover:bg-indigo-700">
            Salvar
          </button>
        </form>
      </Modal>

      <Modal isOpen={isDespesaModalOpen} onClose={() => setIsDespesaModalOpen(false)} title="Adicionar Despesa">
        <form onSubmit={handleAddDespesa} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Data</label>
              <input 
                type="date" 
                required
                value={newDespesa.data}
                onChange={e => setNewDespesa(prev => ({ ...prev, data: e.target.value }))}
                className="mt-1 w-full rounded-xl border-gray-200 bg-gray-50 p-3 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Valor (R$)</label>
              <input 
                type="number" 
                step="0.01"
                required
                value={newDespesa.valor}
                onChange={e => setNewDespesa(prev => ({ ...prev, valor: e.target.value }))}
                className="mt-1 w-full rounded-xl border-gray-200 bg-gray-50 p-3 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Origem (Quem pagou)</label>
            <select 
              required
              value={newDespesa.origem_id}
              onChange={e => setNewDespesa(prev => ({ ...prev, origem_id: e.target.value }))}
              className="mt-1 w-full rounded-xl border-gray-200 bg-gray-50 p-3 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Selecione...</option>
              {pessoas.map(p => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Destino</label>
            <select 
              required
              value={newDespesa.destino}
              onChange={e => setNewDespesa(prev => ({ ...prev, destino: e.target.value }))}
              className="mt-1 w-full rounded-xl border-gray-200 bg-gray-50 p-3 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Dividir">Dividir entre todos</option>
              {pessoas.map(p => (
                <option key={p.id} value={p.id.toString()}>Somente {p.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Categoria</label>
            <select 
              required
              value={newDespesa.categoria_id}
              onChange={e => setNewDespesa(prev => ({ ...prev, categoria_id: e.target.value }))}
              className="mt-1 w-full rounded-xl border-gray-200 bg-gray-50 p-3 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Selecione...</option>
              {categorias.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="w-full rounded-xl bg-rose-600 py-3 text-white font-bold shadow-soft hover:bg-rose-700">
            Salvar
          </button>
        </form>
      </Modal>

      <Modal isOpen={isSalarioModalOpen} onClose={() => setIsSalarioModalOpen(false)} title="Adicionar Salário">
        <form onSubmit={handleAddSalario} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Data</label>
              <input 
                type="date" 
                required
                value={newSalario.data}
                onChange={e => setNewSalario(prev => ({ ...prev, data: e.target.value }))}
                className="mt-1 w-full rounded-xl border-gray-200 bg-gray-50 p-3 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Valor (R$)</label>
              <input 
                type="number" 
                step="0.01"
                required
                value={newSalario.valor}
                onChange={e => setNewSalario(prev => ({ ...prev, valor: e.target.value }))}
                className="mt-1 w-full rounded-xl border-gray-200 bg-gray-50 p-3 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Recebedor</label>
            <select 
              required
              value={newSalario.recebedor_id}
              onChange={e => setNewSalario(prev => ({ ...prev, recebedor_id: e.target.value }))}
              className="mt-1 w-full rounded-xl border-gray-200 bg-gray-50 p-3 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Selecione...</option>
              {pessoas.map(p => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="w-full rounded-xl bg-emerald-600 py-3 text-white font-bold shadow-soft hover:bg-emerald-700">
            Salvar
          </button>
        </form>
      </Modal>

      <Modal isOpen={isCategoriaModalOpen} onClose={() => setIsCategoriaModalOpen(false)} title="Adicionar Categoria">
        <form onSubmit={handleAddCategoria} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome da Categoria</label>
            <input 
              type="text" 
              required
              value={newCategoria.nome}
              onChange={e => setNewCategoria(prev => ({ ...prev, nome: e.target.value }))}
              className="mt-1 w-full rounded-xl border-gray-200 bg-gray-50 p-3 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button type="submit" className="w-full rounded-xl bg-amber-600 py-3 text-white font-bold shadow-soft hover:bg-amber-700">
            Salvar
          </button>
        </form>
      </Modal>

      <Modal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} title="Log de Atividades">
        <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-2">
          <div className="space-y-2">
            <h3 className="font-bold text-gray-800 border-b pb-1">Despesas Recentes</h3>
            {filteredDespesas.length > 0 ? (
              filteredDespesas.sort((a, b) => b.data.localeCompare(a.data)).map(d => (
                <div key={d.id} className="text-sm p-2 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex justify-between font-medium">
                    <span>{d.origem_nome} → {d.destino === 'Dividir' ? 'Todos' : (pessoas.find(p => p.id.toString() === d.destino)?.nome || 'Outro')}</span>
                    <span className="text-rose-600">R$ {d.valor.toFixed(2)}</span>
                  </div>
                  <div className="text-xs text-gray-500 flex justify-between mt-1">
                    <span>{d.categoria_nome}</span>
                    <span>{format(parseISO(d.data), 'dd/MM/yyyy')}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic">Nenhuma despesa neste período.</p>
            )}
          </div>

          <div className="space-y-2 pt-4">
            <h3 className="font-bold text-gray-800 border-b pb-1">Salários Recentes</h3>
            {filteredSalarios.length > 0 ? (
              filteredSalarios.sort((a, b) => b.data.localeCompare(a.data)).map(s => (
                <div key={s.id} className="text-sm p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                  <div className="flex justify-between font-medium">
                    <span>{s.recebedor_nome}</span>
                    <span className="text-emerald-600">R$ {s.valor.toFixed(2)}</span>
                  </div>
                  <div className="text-xs text-gray-500 text-right mt-1">
                    {format(parseISO(s.data), 'dd/MM/yyyy')}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic">Nenhum salário neste período.</p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
