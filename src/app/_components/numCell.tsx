"use client"

import type { CellContext } from "@tanstack/react-table"
import { useState } from "react" 
import { api } from "~/trpc/react"

interface CellProp<TData, TValue> {
    info: CellContext<TData, TValue>;
  }

export default function NumCell<TData, TValue>({ info }: CellProp<TData, TValue>) {
    type TableCell = { value: string | number | null; cellId: string | null };

    const cellData = (info.getValue() as TableCell) ?? { value: null, cellId: null };
    const { value, cellId } = cellData;    
    const [cellValue, setCellValue] = useState<string>(String(value))
    const { mutateAsync } = api.user.editNumCell.useMutation();
    
    function handleChange(newVal: string, cellId: string | null) {
        if (!cellId) {
            console.error("No cellId provided");
            return;
          }
          if (newVal === "") {
            setCellValue("");
            mutateAsync({ cellId, newVal: null }).catch(console.error);
          } else {
            const numVal = Number(newVal);
            setCellValue(newVal);
            mutateAsync({ cellId, newVal: numVal }).catch(console.error);
          }
    }

    return (
    <>
        <input type="number" value={cellValue} onChange={(e) => {
            const val = e.target.value;
            setCellValue(e.target.value);
            }} onBlur={(e) => handleChange((e.target.value), cellId)}>
        </input>
    </>
    )
}