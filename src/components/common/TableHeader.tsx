import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface TableHeaderProps {
  label: string;
  columnKey: string;
  sortState: { key: string; direction: 'asc' | 'desc' } | null;
  onSort: (key: string) => void;
}

export const TableHeader = ({ label, columnKey, sortState, onSort }: TableHeaderProps) => {
  const isSorted = sortState?.key === columnKey;
  
  return (
    <th 
      className="sticky top-0 px-4 py-3 font-semibold bg-gray-100 cursor-pointer hover:bg-gray-200 transition-colors select-none group z-10"
      onClick={() => onSort(columnKey)}
    >
      <div className="flex items-center gap-2">
        <span className="truncate">{label}</span>
        <div className="flex flex-col shrink-0">
          {isSorted ? (
            sortState.direction === 'asc' ? (
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
