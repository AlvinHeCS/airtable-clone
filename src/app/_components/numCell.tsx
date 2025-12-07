"use client"

import type { CellContext } from "@tanstack/react-table"
import { api } from "~/trpc/react"
import "./numCell.css";
import type { TableRow, View, Row, Filter, Sort } from "~/types/types";

interface CellProp {
  info: CellContext<TableRow, Record<string, string | boolean> | string>;
  tableId: string;
  views: View[];
  viewId: string;
}

export default function StringCell(prop: CellProp) {
  const utils = api.useUtils();
  const meta = prop.info.column.columnDef.meta as { colIndex: number, second: boolean, sortHighlight: boolean };
  const { mutateAsync } = api.table.editCell.useMutation();

  const handleChange = async (newVal: string) => {

    await mutateAsync({ 
      rowId: prop.info.row.original.id, 
      col: meta.colIndex, 
      newVal 
    });
    // Update the cached infinite query
    for (let view of prop.views) {
      utils.table.rowsAhead.setInfiniteData(
        { viewId: view.id, tableId: prop.tableId},
        (oldData) => {
          if (!oldData) return oldData;
          const newPages = oldData.pages.map(page => {
            let newRows = page.rows.map(row => {
                if (row.id !== prop.info.row.original.id) return row;
                const newCellsFlat = [...row.cellsFlat]
                newCellsFlat[meta.colIndex] = newVal === "" ? null : Number(newVal)
                return {
                  ...row,
                  cellsFlat: newCellsFlat
                };
              })
            return {
              ...page,
              rows: newRows,
            };
          });
          return {
            ...oldData,
            pages: newPages,
          };
        }
      );
    }
  };

  return (
    <div style={{textAlign: "left", paddingLeft: "5px", color: "#1D1F26"}}>
      <input 
          style={{width: "100%"}}
          type="number" 
          defaultValue={(prop.info.getValue() as Record<string, string | boolean>).val as string} 
          onBlur={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => {
              if (e.key === "e" || e.key === "E" || e.key === "+" || e.key === "-" || e.key === "ArrowUp" || e.key === "ArrowDown") {
                e.preventDefault();
              }
            }
          }
      />
    </div>
  );
}