"use client"

import type { CellContext } from "@tanstack/react-table"
import { useState } from "react" 
import { api } from "~/trpc/react"

type TableRow = Record<string, string> & { rowId: string };

interface CellProp {
  info: CellContext<TableRow, string>;
}

export default function StringCell({ info }: CellProp) {
  const utils = api.useUtils();
  const colIndex = (info.column.columnDef.meta as { colIndex: number }).colIndex;

  const [cellValue, setCellValue] = useState<string>(info.getValue() ?? "");

  const { mutateAsync } = api.table.editCell.useMutation({
    onSuccess: () => {
        utils.base.getTableFromName.invalidate();
    }
  });

  const handleChange = (newVal: string) => {
      setCellValue(newVal);
      mutateAsync({ 
        rowId: info.row.original.rowId, 
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