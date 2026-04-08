import { Pessoa, Categoria, Despesa, Salario } from "../types";

const apiFetch = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const res = await fetch(url, options);
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Erro na chamada de API: ${res.statusText}`);
  }
  return res.json();
};

export const api = {
  getPessoas: () => apiFetch<Pessoa[]>("/api/pessoas"),
  createPessoa: (data: Partial<Pessoa>) => apiFetch<Pessoa>("/api/pessoas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }),
  deletePessoa: (id: number) => apiFetch<{ success: boolean }>(`/api/pessoas/${id}`, {
    method: "DELETE",
  }),

  getCategorias: () => apiFetch<Categoria[]>("/api/categorias"),
  createCategoria: (data: Partial<Categoria>) => apiFetch<Categoria>("/api/categorias", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }),
  updateCategoria: (id: number, data: Partial<Categoria>) => apiFetch<Categoria>(`/api/categorias/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }),
  deleteCategoria: (id: number) => apiFetch<{ success: boolean }>(`/api/categorias/${id}`, {
    method: "DELETE",
  }),

  getDespesas: () => apiFetch<Despesa[]>("/api/despesas"),
  createDespesa: (data: any) => apiFetch<Despesa>("/api/despesas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }),
  updateDespesa: (id: number, data: any) => apiFetch<{ success: boolean }>(`/api/despesas/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }),
  deleteDespesa: (id: number) => apiFetch<{ success: boolean }>(`/api/despesas/${id}`, {
    method: "DELETE",
  }),

  getSalarios: () => apiFetch<Salario[]>("/api/salarios"),
  createSalario: (data: any) => apiFetch<Salario>("/api/salarios", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }),
  updateSalario: (id: number, data: any) => apiFetch<{ success: boolean }>(`/api/salarios/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }),
  deleteSalario: (id: number) => apiFetch<{ success: boolean }>(`/api/salarios/${id}`, {
    method: "DELETE",
  }),

  getLogs: () => apiFetch<any[]>("/api/logs"),
  
  resetData: () => apiFetch<{ success: boolean }>("/api/reset", {
    method: "POST",
  })
};
