"use client"

import type { CellContext } from "@tanstack/react-table"
import { useState } from "react" 
import { api } from "~/trpc/react"

interface CellProp<TData, TValue> {
    info: CellContext<TData, TValue>;
}


export default function StringCell<TData, TValue>({ info }: CellProp<TData, TValue>) {
    type TableCell = { value: string | number | null; cellId: string | null };

    const cellData = (info.getValue() as TableCell) ?? { value: "", cellId: null };
    const { value, cellId } = cellData;  
    const [cellValue, setCellValue] = useState<string>(String(value))
    const { mutateAsync } = api.user.editStringCell.useMutation();

    const handleChange = (newVal: string, cellId: string | null) => {
        setCellValue(newVal);
        if (cellId) {
          mutateAsync({ cellId, newVal }).catch(console.error);
        } else {
          console.error("No cellId provided");
        }
    };

    return (
    <>
        <input type="text" value={cellValue} onChange={(e) => setCellValue(e.target.value)} onBlur={(e) => handleChange(e.target.value, cellId)}></input>
    </>
    )
}