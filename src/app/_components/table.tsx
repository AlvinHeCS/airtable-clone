"use client"

import { useState, useEffect, useMemo } from "react"
import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";
import type { ColumnDef, CellContext } from "@tanstack/react-table";
import { api } from "~/trpc/react"
import NewColModal from "./newColModal";
import NumCell from "./numCell";
import StringCell from "./stringCell";

interface TableProp {
    name: string;
    baseId: string;
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
    const { data: table, isLoading: tableLoading } = api.base.getTableFromName.useQuery({tableName: prop.name, baseId: prop.baseId})
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
  const columns = useMemo<ColumnDef<TableRow, string>[]>(() => {
    if (!table) return [];

    const rowNumberCol: ColumnDef<TableRow, string> = {
      id: "rowNumber",
      header: "#",
      cell: (info) => (
        <div style={{ textAlign: "center", padding: "5px" }}>
          {info.row.index + 1}
        </div>
      ),
      meta: { colIndex: -1 },
      size: 40,
    };

    const dataCols = table.headers.map((header, i) => ({
      accessorKey: header,
      header: () => {
        if (table.headerTypes[i] === 0) {
          return (
            <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center", gap: "4px", padding: "5px" }}>
              <img 
                src="/letter.svg" 
                alt="icon" 
                style={{ width: "14px", height: "14px" }} 
              />
              <span>{header}</span>
            </div>
          );
        } else {
          return (
            <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center", gap: "4px", padding: "5px" }}>
              <img 
                src="/hashtag.svg" 
                alt="icon" 
                style={{ width: "14px", height: "14px" }} 
              />
              <span>{header}</span>
            </div>
          );
        }
      },
      meta: { colIndex: i } as { colIndex: number },
      cell: (info: CellContext<TableRow, string>) => {
        if (table.headerTypes[i] === 0) return <StringCell info={info} />;
        else return <NumCell info={info} />;
      },
    }));
    return [rowNumberCol, ...dataCols];
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
        <div style={{display: "flex", flexDirection: "column", overflow: "auto"}}>
          {showModal && table && (
            <NewColModal tableId={{ id: table.id, setModal: setShowModal }} />
          )}
          <div style={{display: "flex"}}>        
          <table style={{ minWidth: "max-content", borderCollapse: "collapse" }}>
  {/* Header with Add Column Button */}
  <thead>
    {tanTable.getHeaderGroups().map(headerGroup => (
      <tr key={headerGroup.id}>
        {headerGroup.headers.map(header => (
          <th
            style={{ border: "solid rgb(208, 208, 208) 1px", height: "30px", width: "300px", fontSize: "12px" }}
            key={header.id}
          >
            {flexRender(header.column.columnDef.header, header.getContext())}
          </th>
        ))}
        {/* Add Column Button */}
        <th style={{ width: "110px", height: "30px", border: "solid rgb(208,208,208) 1px" }}>
          <button
            onClick={() => setShowModal(true)}
            style={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}
          >
            <img style={{ height: "20px", width: "20px" }} src="/plus2.svg" />
          </button>
        </th>
      </tr>
    ))}
  </thead>

  {/* Table Body */}
  <tbody>
    {tanTable.getRowModel().rows.map(row => (
      <tr key={row.id}>
        {row.getVisibleCells().map(cell => (
          <td
            key={cell.id}
            data-row={row.index}
            data-col={(cell.column.columnDef.meta as { colIndex: number })?.colIndex ?? 0}
            tabIndex={0}
            style={{ border: "solid rgb(208, 208, 208) 1px", height: "30px", width: "300px", fontSize: "12px", padding: "5px" }}
            onClick={() =>
              setSelectedCell({
                rowIndex: row.index,
                colIndex: (cell.column.columnDef.meta as { colIndex: number })?.colIndex ?? 0,
              })
            }
            onKeyDown={(e) => navigateBetweenCells(e.key, row.index, (cell.column.columnDef.meta as { colIndex: number })?.colIndex ?? 0)}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </td>
        ))}
      </tr>
    ))}
  </tbody>

  {/* Footer with Add Row Buttons */}
  <tfoot>
    <tr>
      <td colSpan={table ? table.headers.length + 1 : 1} style={{ border: "solid rgb(208,208,208) 1px", padding: "5px" }}>
        <div style={{ display: "flex", gap: "4px" }}>
          <button
            onClick={addRow}
            style={{ height: "31px", width: "81px", display: "flex", justifyContent: "center", alignItems: "center", border: "solid rgb(208,208,208) 1px" }}
          >
            <img style={{ height: "20px", width: "20px" }} src="/plus2.svg" />
          </button>
          <button
            onClick={add100kRow}
            style={{ height: "31px", width: "81px", display: "flex", justifyContent: "center", alignItems: "center", border: "solid rgb(208,208,208) 1px" }}
          >
            100k
          </button>
        </div>
      </td>
    </tr>
  </tfoot>
</table>
          </div>
        </div>
    )
}