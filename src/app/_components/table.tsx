"use client"

import { useState, useEffect, useMemo } from "react"
import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import { api } from "~/trpc/react"
import NewColModal from "./newColModal";

interface TableProp {
    tableData: {
        id: string;
        baseId: string;
        creationDate: Date;
        headers: string[];
        rows: Row[];
        name: string;
    }
}

type Row = {
    id: string;
    rowNum: number;
    cells: Cell[];
    tableId: string;
}

type Cell = {
    id: string;
    colNum: number;
    valInt: number | null;
    valStr: string | null;
}

export default function Table(prop: TableProp) {
    const utils = api.useUtils();
    const table = prop.tableData;
    const { mutateAsync: mutateAsyncRow } = api.user.addRow.useMutation({
      onSuccess: () => {
        utils.user.getBaseTables.invalidate();
    }
    });
    const [data, setData] = useState<Record<string, string | number | null>[]>([]);
    const [showModal, setShowModal] = useState<boolean>(false);
    function addRow() {
      mutateAsyncRow({tableId: table.id})
    }


    useEffect(() => {
      const mappedData = table.rows.map((row) => {
        const rowData: Record<string, string | number | null> = {};
  
        for (let i = 0; i < table.headers.length; i++) {
          let header = table.headers[i] || "";
          const cell = row.cells.find((c) => c.colNum === i);
          const value = cell?.valStr ?? cell?.valInt ?? null;
          rowData[header] = value;
        }
  
        return rowData;
      });
      setData(mappedData);
    }, [table]);    

  // create columns dynamically
  const columns = useMemo<ColumnDef<Record<string, string | number | null>>[]>(() => 
    table.headers.map((header) => ({
      accessorKey: header, 
      header: header,      
      cell: info => {
        const value = info.getValue() as string | number | null;
        return <span>{value}</span>;
      }    })), [table.headers]
  );

  // create TanStack table instance
  const tanTable = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
    return(
        <div>
          {showModal && (
            <NewColModal tableId={{ id: table.id, setModal: setShowModal }} />
          )}        
          <h2>{table.name}</h2>
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
                      return(<td key={cell.id} style={{border: "solid black 1px", height: "40px", width: "80px"}}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)
                      })}
                  </tr>
              ))}
              </tbody>
          </table>
          <button onClick={addRow}>Add new row</button>
          <button onClick={() => setShowModal(true)}>Add new col</button>
        </div>
    )
}