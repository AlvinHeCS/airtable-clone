"use client"

import type { CellContext } from "@tanstack/react-table"
import { api } from "~/trpc/react"
import type { TableRow, View } from "~/types/types";

interface CellProp {
  info: CellContext<TableRow, Record<string, string | boolean> | string>;
  tableId: string;
  views: View[];
  viewId: string;
}

export default function CheckBoxCell(prop: CellProp) {

  const utils = api.useUtils();
  const meta = prop.info.column.columnDef.meta as { colIndex: number, second: boolean, sortHighlight: boolean };
  const { mutateAsync, mutate } = api.table.editCell.useMutation();

  const handleChange = async (newVal: string) => {
    // mutate backend cell value
    console.log("this is newVal: ", newVal)
    mutate({ 
      rowId: prop.info.row.original.id, 
      col: meta.colIndex, 
      newVal: newVal
    });
    // Update the cached infinite query for all view
    for (let view of prop.views) {
      utils.table.rowsAhead.setInfiniteData(
        { viewId: view.id, tableId: prop.tableId },
        (oldData) => {
          if (!oldData) return oldData;
          const newPages = oldData.pages.map(page => {
            let newRows = page.rows.map(row => {
              if (row.id !== prop.info.row.original.id) {
                return row;
              } else {
                const newCellsFlat = [...row.cellsFlat]
                if (newVal === "true") {
                    console.log("went into here")
                    newCellsFlat[meta.colIndex] = true
                } else {
                    newCellsFlat[meta.colIndex] = false
                }
                return {
                  ...row,
                  cellsFlat: newCellsFlat
                }
              }
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
          type="checkbox" 
          checked={(((prop.info.getValue() as Record<string, string | boolean>).val as string) === "true") ? true : false}
          onChange={(e) => handleChange(String(e.target.checked))}
      />
    </div>

  );
}