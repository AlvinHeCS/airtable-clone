"use client"

import { useState, useEffect, useMemo } from "react"
import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import { api } from "~/trpc/react"
import NewColModal from "./newColModal";
import NumCell from "./numCell";
import StringCell from "./stringCell";

interface TableProp {
    name: string
}

type Table = {
  id: string;
  baseId: string;
  creationDate: Date;
  headers: string[];
  headerTypes: number[];
  numRows: number;
  rows: Row[];
  name: string;
}

type Row = {
    id: string;
    rowNum: number;
    cells: string[];
    tableId: string;
}
type TableRow = Record<string, string> & { rowId: string };


export default function Table(prop: TableProp) {
    const utils = api.useUtils();
    const tableName = prop.name;

    const { data: table, isLoading: tableLoading } = api.base.getTableFromName.useQuery({tableName: tableName})
    const [selectedCell, setSelectedCell] = useState<{ rowIndex: number; colIndex: number } | null>(null);
    const [data, setData] = useState<TableRow[]>([]);
    const [showModal, setShowModal] = useState<boolean>(false);
    const { mutateAsync: mutateAsyncRow } = api.table.addRow.useMutation({
      onSuccess: () => {
        utils.base.getTableFromName.invalidate();
    }
    });
    const { mutateAsync: mutateAsyncRow100k } = api.table.add100kRow.useMutation({
      onSuccess: () => {
        utils.base.getTableFromName.invalidate();
    }
    });

    useEffect(() => {
      if (!table) {
        setData([]);
      } else {
        const mappedData: TableRow[] = table.rows.map((row) => {
          const rowData: TableRow = { rowId: row.id };
          for (let i = 0; i < table.headers.length; i++) {
            const header = table.headers[i] || "";
            const cell = row.cells[i] || "";
            rowData[header] = cell;
          }
          return rowData;
        });
        setData(mappedData);
      }
    }, [table]);
    

  // create columns dynamically
  const columns = useMemo<ColumnDef<TableRow, any>[]>(() => {
    if (!table) return [];
    
    return table.headers.map((header, i) => ({
      accessorKey: header,
      header: header,
      meta: { colIndex: i } as { colIndex: number },
      cell: (info) => {
        if (table.headerTypes[i] === 0) return <StringCell info={info} />;
        else return <NumCell info={info} />;
      },
    }));
  }, [table?.headers, table?.headerTypes]);

  // create TanStack table instance
  const tanTable = useReactTable({
    data,
    columns: columns as ColumnDef<TableRow, any>[],
    getCoreRowModel: getCoreRowModel(),
  });


  const navigateBetweenCells = (key: string, rowIndex: number, colIndex: number) => {
    let newRow = rowIndex;
    let newCol = colIndex;
    if (!table) {
      return
    }
    switch (key) {
      case "ArrowUp":
        newRow = Math.max(0, rowIndex - 1);
        break;
      case "ArrowDown":
        newRow = Math.min(data.length - 1, rowIndex + 1);
        break;
      case "ArrowLeft":
        newCol = Math.max(0, colIndex - 1);
        break;
      case "ArrowRight":
        newCol = Math.min(table.headers.length - 1, colIndex + 1);
        break;
      default:
        return;
    }  
    setSelectedCell({ rowIndex: newRow, colIndex: newCol });
  
    const cellElement = document.querySelector(
      `td[data-row='${newRow}'][data-col='${newCol}']`
    ) as HTMLElement | null;
    cellElement?.focus();
  }

  function addRow() {
    if (!table) {
      return
    }
    mutateAsyncRow({tableId: table.id})
  }

   const add100kRow = () => {
    if (!table) {
      return
    }
    mutateAsyncRow100k({tableId: table.id});
  }

    if (tableLoading) {
      return (
        <>loading table</>
      )
    }

    return(
        <div>
          {showModal && table && (
            <NewColModal tableId={{ id: table.id, setModal: setShowModal }} />
          )}        
          <table>
              <thead>
              {tanTable.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                      <th key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</th>
                  ))}
                  </tr>
              ))}
              </thead>
              <tbody>
              {tanTable.getRowModel().rows.map(row => (
                  <tr key={row.id}>
                  {row.getVisibleCells().map(cell => {
                      return(
                      <td key={cell.id} 
                        data-row={row.index}
                        data-col={(cell.column.columnDef.meta as { colIndex: number })?.colIndex ?? 0}
                        tabIndex={0} 
                        style={{border: "solid black 1px", height: "40px", width: "80px"}}
                        onClick={() =>   setSelectedCell({
                          rowIndex: row.index,
                          colIndex: (cell.column.columnDef.meta as { colIndex: number })?.colIndex ?? 0
                        })
                        }
                        onKeyDown={(e) => {navigateBetweenCells(e.key, row.index, (cell.column.columnDef.meta as { colIndex: number })?.colIndex ?? 0)}}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                      )
                  })}
                  </tr>
              ))}
              </tbody>
          </table>
          <button onClick={addRow}>Add new row</button>
          <button onClick={add100kRow}>Add 100k rows</button>
          <button onClick={() => setShowModal(true)}>Add new col</button>
        </div>
    )
}