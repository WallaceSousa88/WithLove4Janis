import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import { Pessoa, Categoria } from "../types";

export const usePessoas = () => useQuery({ queryKey: ["pessoas"], queryFn: api.getPessoas });
export const useCategorias = () => useQuery({ queryKey: ["categorias"], queryFn: api.getCategorias });
export const useDespesas = () => useQuery({ queryKey: ["despesas"], queryFn: api.getDespesas });
export const useSalarios = () => useQuery({ queryKey: ["salarios"], queryFn: api.getSalarios });
export const useLogs = () => useQuery({ queryKey: ["logs"], queryFn: api.getLogs });

export const useAppMutations = () => {
  const queryClient = useQueryClient();

  const onSuccessDespesa = () => {
    queryClient.invalidateQueries({ queryKey: ["despesas"] });
    queryClient.invalidateQueries({ queryKey: ["logs"] });
  };

  const onSuccessSalario = () => {
    queryClient.invalidateQueries({ queryKey: ["salarios"] });
    queryClient.invalidateQueries({ queryKey: ["logs"] });
  };

  const onSuccessPessoa = () => {
    queryClient.invalidateQueries({ queryKey: ["pessoas"] });
    queryClient.invalidateQueries({ queryKey: ["logs"] });
  };

  const onSuccessCategoria = () => {
    queryClient.invalidateQueries({ queryKey: ["categorias"] });
    queryClient.invalidateQueries({ queryKey: ["logs"] });
  };

  return {
    createDespesa: useMutation({ mutationFn: api.createDespesa, onSuccess: onSuccessDespesa }),
    updateDespesa: useMutation({ mutationFn: ({ id, data }: { id: number, data: any }) => api.updateDespesa(id, data), onSuccess: onSuccessDespesa }),
    deleteDespesa: useMutation({ mutationFn: api.deleteDespesa, onSuccess: onSuccessDespesa }),

    createSalario: useMutation({ mutationFn: api.createSalario, onSuccess: onSuccessSalario }),
    updateSalario: useMutation({ mutationFn: ({ id, data }: { id: number, data: any }) => api.updateSalario(id, data), onSuccess: onSuccessSalario }),
    deleteSalario: useMutation({ mutationFn: api.deleteSalario, onSuccess: onSuccessSalario }),

    createPessoa: useMutation({ mutationFn: api.createPessoa, onSuccess: onSuccessPessoa }),
    deletePessoa: useMutation({ mutationFn: api.deletePessoa, onSuccess: onSuccessPessoa }),

    createCategoria: useMutation({ mutationFn: api.createCategoria, onSuccess: onSuccessCategoria }),
    updateCategoria: useMutation({ mutationFn: ({ id, data }: { id: number, data: Partial<Categoria> }) => api.updateCategoria(id, data), onSuccess: onSuccessCategoria }),
    deleteCategoria: useMutation({ mutationFn: api.deleteCategoria, onSuccess: onSuccessCategoria }),
    
    resetData: useMutation({ 
      mutationFn: api.resetData, 
      onSuccess: () => queryClient.invalidateQueries() 
    })
  };
};
