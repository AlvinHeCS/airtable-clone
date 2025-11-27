"use client"

import type { CellContext } from "@tanstack/react-table"
import { useState } from "react" 
import { api } from "~/trpc/react"
import "./numCell.css";
import type { TableRow, View } from "~/types/types";

interface CellProp {
  info: CellContext<TableRow, string>;
  baseId: string;
  tableName: string;
  tableId: string;
  viewName: string;
  views: View[];
}

export default function StringCell(prop: CellProp) {
  const utils = api.useUtils();
  const colIndex = (prop.info.column.columnDef.meta as { colIndex: number }).colIndex;

  const [cellValue, setCellValue] = useState<string>(prop.info.getValue() ?? "");

  const { mutateAsync } = api.table.editCell.useMutation();
  const handleChange = async (newVal: string) => {
      setCellValue(newVal);
  try {
    await mutateAsync({ 
      rowId: prop.info.row.original.rowId, 
      col: colIndex, 
      newVal 
    });
    // Update the cached infinite query
    for (let view of prop.views) {
      utils.table.getTableAndViewWithRowsAhead.setInfiniteData(
        { viewName: view.name, baseId: prop.baseId, tableName: prop.tableName },
        //   pages: {
        //     table: Table;
        //     rows: Row[]; size is 200 as long as theres more
        //     nextCursor: number | null;
        //     view: View;
        //   }[],
        (oldData) => {
          if (!oldData) return oldData;
          // Update the correct cell in all pages
          const newPages = oldData.pages.map(page => {
            return {
              ...page,
              rows: page.rows.map(row => {
                if (row.id !== prop.info.row.original.rowId) return row;

                return {
                  ...row,
                  cells: row.cells.map(cell => {
                    if (cell.colNum !== colIndex) return cell;
                    return { ...cell, val: newVal };
                  }),
                };
              }),
            };
          });

          return {
            ...oldData,
            pages: newPages,
          };
        }
      );
    }
  } catch (err) {
    console.error(err);
  }
  };

  return (
      <input 
          type="number" 
          value={cellValue} 
          onChange={(e) => setCellValue(e.target.value)} 
          onBlur={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => {
              if (e.key === "e" || e.key === "E" || e.key === "+" || e.key === "-") {
                e.preventDefault();
              }
            }
          }
      />
  );
}