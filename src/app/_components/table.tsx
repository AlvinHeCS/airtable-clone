"use client"

import { useState, useEffect, useMemo } from "react"
import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import { api } from "~/trpc/react"
import NewColModal from "./newColModal";
import NumCell from "./numCell";
import StringCell from "./stringCell";

interface TableProp {
    tableData: {
        id: string;
        baseId: string;
        creationDate: Date;
        headers: string[];
        headerTypes: number[];
        numRows: number;
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

    type TableCell = { 
      value: string | number | null; 
      cellId: string | null 
    };
    // data is an array containing objects 
    // {string: TableCell}
    const [data, setData] = useState<Record<string, TableCell>[]>([]);
    const [showModal, setShowModal] = useState<boolean>(false);
    function addRow() {
      mutateAsyncRow({tableId: table.id})
    }

    // table.rows is an obect containing


    useEffect(() => {
      const mappedData = table.rows.map((row) => {
        const rowData: Record<string, { value: string | number | null; cellId: string | null }> = {};
    
        for (let i = 0; i < table.headers.length; i++) {
          const header = table.headers[i] || "";
          const cell = row.cells.find((c) => c.colNum === i);
    
          rowData[header] = {
            value: cell?.valStr ?? cell?.valInt ?? null,
            cellId: cell?.id ?? null,
          };
        }
    
        return rowData;
      });
    
      setData(mappedData);
    }, [table]);

  // create columns dynamically
  const columns = useMemo<ColumnDef<Record<string, TableCell>>[]>(() =>
    table.headers.map((header, i) => ({
      accessorKey: header, 
      header: header,      
      cell: (info) => {
        if (table.headerTypes[i] === 0) {
          return (<StringCell info={info}/>)
        } else {
          return (<NumCell info={info}/>)
        }
      }
        })), [table.headers]
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