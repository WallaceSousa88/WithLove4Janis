import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Pessoa } from '../types';

export interface ExportOptions {
  filename: string;
  format: 'xlsx' | 'csv';
  columns: string[];
}

export const useExport = () => {
  const handleExportData = async (options: ExportOptions, selectedPersonDetails: any, pessoas: Pessoa[]) => {
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

  const handleExportLog = async (options: ExportOptions, filteredMovements: any[]) => {
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

  return { handleExportData, handleExportLog };
};
