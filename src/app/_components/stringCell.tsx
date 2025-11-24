"use client"

import type { CellContext } from "@tanstack/react-table"
import { useState } from "react" 
import { api } from "~/trpc/react"

type TableRow = Record<string, string> & { rowId: string };

interface CellProp {
  info: CellContext<TableRow, string>;
  baseId: string;
  tableName: string;
  tableId: string;
}

export default function StringCell(prop: CellProp) {
  const utils = api.useUtils();
  const colIndex = (prop.info.column.columnDef.meta as { colIndex: number }).colIndex;

  const [cellValue, setCellValue] = useState<string>(prop.info.getValue() ?? "");

  const { mutateAsync } = api.table.editCell.useMutation();

  const handleChange = (newVal: string) => {
      setCellValue(newVal);
      mutateAsync({ 
        rowId: prop.info.row.original.rowId, 
        col: colIndex, 
        newVal 
      }).catch(console.error);
  };

  return (
      <input 
          type="text" 
          value={cellValue} 
          onChange={(e) => setCellValue(e.target.value)} 
          onBlur={(e) => handleChange(e.target.value)}
      />
  );
}