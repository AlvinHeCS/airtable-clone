"use client"

import type { CellContext } from "@tanstack/react-table"
import { api } from "~/trpc/react"
import type { TableRow, View, Row, Filter, Sort } from "~/types/types";

interface CellProp {
  info: CellContext<TableRow, string>;
  tableId: string;
  views: View[];
  viewId: string;
}

export default function StringCell(prop: CellProp) {
  const utils = api.useUtils();
  const meta = prop.info.column.columnDef.meta as { colIndex: number, second: boolean, sortHighlight: boolean };
  const { mutateAsync } = api.table.editCell.useMutation();
    function filterRows(newRows: Row[], filters: Filter[]) {
        return newRows.filter((row) => {
            let passed = true
            for (const f of filters) {
                if (f.value === "" && f.type !== "empty" && f.type !== "not_empty") continue;
                switch(f.type) {
                    case "contains":
                        if (!(row.cells[f.columnIndex]!.val.includes(f.value))) {
                            passed = false;
                        }
                        break
                    case "not_contains":
                        if (row.cells[f.columnIndex]!.val.includes(f.value)) {
                            passed = false;
                        }
                        break
                    case "empty":
                        if (row.cells[f.columnIndex]!.val !== "") {
                            passed = false;
                        }
                        break
                    case "not_empty":
                        if (row.cells[f.columnIndex]!.val === "") {
                            passed = false;
                        }
                        break
                    case "eq":
                        if (row.cells[f.columnIndex]!.val !== f.value) {
                            passed = false;
                        }
                        break
                    case "gt":
                        if ((row.cells[f.columnIndex]!.numVal ?? Infinity) <= Number(f.value)) {
                            passed = false;
                        }
                        break
                    case "lt":
                        if ((row.cells[f.columnIndex]!.numVal ?? -Infinity) >= Number(f.value)) {
                            passed = false;
                        }
                        break
                }
            }
            return (passed)
        })
    }

    function sortRows(newRows: Row[], sorts: Sort[]) {
        for (const s of sorts) {
            switch(s.type) {
                case "sort1_9": 
                newRows.sort((a, b) => {
                    const aComparison = (a.cellsFlat as (string | number | null)[])[s.columnIndex]
                    const bComparison = (b.cellsFlat as (string | number | null)[])[s.columnIndex]
                    return (Number(aComparison) - Number(bComparison))
                })
                break;
                case "sort9_1":
                newRows.sort((a, b) => {
                    const aComparison = (a.cellsFlat as (string | number | null)[])[s.columnIndex]
                    const bComparison = (b.cellsFlat as (string | number | null)[])[s.columnIndex]
                    return (Number(bComparison) - Number(aComparison))
                })
                break;
                case "sortA_Z":
                newRows.sort((a, b) => {
                    const aComparison = (a.cellsFlat as (string | number | null)[])[s.columnIndex]
                    const bComparison = (b.cellsFlat as (string | number | null)[])[s.columnIndex]
                    return (String(aComparison).localeCompare(String(bComparison)))
                })
                break;
                case "sortZ_A":
                newRows.sort((a, b) => {
                    const aComparison = (a.cellsFlat as (string | number | null)[])[s.columnIndex]
                    const bComparison = (b.cellsFlat as (string | number | null)[])[s.columnIndex]
                    return (String(bComparison).localeCompare(String(aComparison)))
                })
                break;
            }
        }
        return newRows
    }
  const handleChange = async (newVal: string) => {
    // mutate backend cell value
    await mutateAsync({ 
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
                return {
                  ...row,
                  cells: row.cells.map(cell => {
                    if (cell.colNum !== meta.colIndex) return cell;
                    return { ...cell, val: newVal };
                  }),
                }
              }
            })
            newRows = filterRows(newRows as Row[], view.filters);
            newRows = sortRows(newRows as Row[], view.sorts);            
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
      <input 
          type="text" 
          defaultValue={prop.info.getValue()} 
          onBlur={(e) => handleChange(e.target.value)}
      />
  );
}