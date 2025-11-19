"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";
import type { ColumnDef, CellContext } from "@tanstack/react-table";
import { api } from "~/trpc/react"
import NewColModal from "./newColModal";
import NumCell from "./numCell";
import StringCell from "./stringCell";
import CircularProgress from '@mui/material/CircularProgress';
import { useVirtualizer } from '@tanstack/react-virtual';

interface TableProp {
    name: string;
    baseId: string;
    scrollingRef: React.RefObject<HTMLDivElement | null>;
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

// rather then rendering on table.headers and table?.headers its gonna be we fetch initally table, and from that we set the localHeaders and localHeaderTypes similar to data


    const utils = api.useUtils();
    const { data: table, isLoading: tableLoading, isFetching: tableFetching } = api.base.getTableFromName.useQuery({tableName: prop.name, baseId: prop.baseId})
    
    const [localHeaders, setLocalHeaders] = useState<string[]>([]);
    const [localHeaderTypes, setLocalHeadersTypes] = useState<number[]>([]);

    const [selectedCell, setSelectedCell] = useState<{ rowIndex: number; colIndex: number } | null>(null);
    const [data, setData] = useState<TableRow[]>([]);
    const [showModal, setShowModal] = useState<boolean>(false);
    
    const { data: infiniteData, fetchNextPage, hasNextPage, isFetchingNextPage, refetch, } = api.base.getTableRowsAhead.useInfiniteQuery( { tableName: prop.name, baseId: prop.baseId },
       { getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.newCursor : undefined, } )
    const allRows = useMemo(() => {
      return infiniteData?.pages.flatMap(page => page.rows) ?? [];
    }, [infiniteData]);

    // set up virtualizer with how many rows have been rendered, scroll element which is the container containg the table, and estimate size of each row
    // virtualizer keeps tracking of scrolling
    const virtualizer = useVirtualizer({
      count: allRows.length,
      getScrollElement: () => prop.scrollingRef?.current ?? null,
      estimateSize: () => 40,
    });

    // how many rows is expected to be rendered on the page
    const virtualRows = virtualizer.getVirtualItems();

    // if you are within 10 rows of the last row then render new rows in 
    useEffect(() => {
      const lastRow = virtualRows[virtualRows.length - 1];
      if (!lastRow) return;
      if (lastRow.index >= allRows.length - 10 && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }, [virtualRows]);
    
    
    const { mutateAsync: mutateAsyncRow } = api.table.addRow.useMutation();
    const { mutateAsync: mutateAsyncRow100k } = api.table.add100kRow.useMutation({
      onSuccess: () => {
        utils.base.getTableFromName.invalidate();
    }
    });

    // check if table is cached if so then just use the cached variable else build the table from backend Data
    // this should only trigger when switching between table or entering a base
    // now it relised on allRows therefore I need it to wait for allRows to render first 

    useEffect(() => {
        if (table) {
          const newData: TableRow[]=  allRows.map(row => {
            const rowData: TableRow = { rowId: row.id };
            table.headers.forEach((header, i) => {
              rowData[header] = row.cells[i] ?? "";
            });
            return rowData;
          })
          setData(newData);
          setLocalHeaders(table.headers);
          setLocalHeadersTypes(table.headerTypes);
        }
    }, [prop.name, prop.baseId, table, allRows]);


  // create columns dynamically
  const columns = useMemo<ColumnDef<TableRow, string>[]>(() => {
    if (localHeaderTypes.length === 0 || localHeaderTypes.length === 0) return [];

    const rowNumberCol: ColumnDef<TableRow, string> = {
      id: "rowNumber",
      header: () => {
        return(
          <div style={{ textAlign: "left", padding: "5px"}}>
            <img style={{width: "15px", height: "15px"}} src="/checkBox.svg"></img>
          </div>
        )
      },
      cell: (info) => (
        <div style={{ textAlign: "left", padding: "5px"}}>
          {info.row.index + 1}
        </div>
      ),
      meta: { colIndex: -1, width: "50px", first: true },
      size: 40,
    };

    const dataCols = localHeaders.map((header, i) => ({
      accessorKey: header,
      header: () => {
        if (localHeaderTypes[i] === 0) {
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
      meta: { colIndex: i, second: i === 0 ? true : false } as { colIndex: number, second: boolean },
      cell: (info: CellContext<TableRow, string>) => {
        if (localHeaderTypes[i] === 0) return <StringCell info={info} />;
        else return <NumCell info={info} />;
      },
    }));
    return [rowNumberCol, ...dataCols];
  }, [localHeaders, localHeaderTypes]);

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

  async function addRow() {
    if (!table) {
      return
    }
    const newRow = await mutateAsyncRow({tableId: table.id});
    const rowData: TableRow = { rowId: newRow.id };
    for (let i = 0; i < table.headers.length; i++) {
      const header = table.headers[i] ?? '';
      rowData[header] = newRow.cells[i] ?? '';
    }
    setData((prevData) => [...prevData, rowData]);
  }

   const add100kRow = () => {
    if (!table) {
      return
    }
    mutateAsyncRow100k({tableId: table.id});
  }

    if (tableLoading || tableFetching || !allRows) {
      return (
        <div style={{height: "70vh", display: "flex", width: "100%", justifyContent: "center", alignItems: "center", gap: "10px", color: "rgb(156, 156, 156)"}}>Loading table <CircularProgress size="20px"/></div>
      )
    }

    return(
        <div style={{display: "flex", flexDirection: "column", overflow: "auto"}}>
          {showModal && table && (
            <NewColModal tableId={{ id: table.id, setModal: setShowModal, setData: setData, setLocalHeaders: setLocalHeaders, setLocalHeaderTypes: setLocalHeadersTypes}} />
          )}
          <div style={{display: "flex"}}>        
          <table style={{ minWidth: "max-content", borderCollapse: "collapse" }}>
            <thead>
              {tanTable.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    // header cells for data
                    <th
                      style={{ borderLeft: (header.column.columnDef.meta as { second?: boolean })?.second ? "none" : "solid rgb(208, 208, 208) 1px", borderTop: "solid rgb(208, 208, 208) 1px", borderBottom: "solid rgb(208, 208, 208) 1px",   borderRight: (header.column.columnDef.meta as { first?: boolean })?.first ? "none" : "solid rgb(208, 208, 208) 1px", height: "30px", width: (header.column.columnDef.meta as { width?: number })?.width ?? 200, fontSize: "12px",  }}
                      key={header.id}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                  {/* this header cell is for the add col one */}
                  <th style={{ width: "200px", height: "30px", border: "solid rgb(208,208,208) 1px" }}>
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

            <tbody>
              {tanTable.getRowModel().rows.map(row => (
                <tr key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    // body cells for data
                    <td
                      key={cell.id}
                      data-row={row.index}
                      data-col={(cell.column.columnDef.meta as { colIndex: number })?.colIndex ?? 0}
                      tabIndex={0}
                      style={{ borderLeft: (cell.column.columnDef.meta as { second?: boolean })?.second ? "none" : "solid rgb(208, 208, 208) 1px", borderTop: "solid rgb(208, 208, 208) 1px", borderBottom: "solid rgb(208, 208, 208) 1px",   borderRight: (cell.column.columnDef.meta as { first?: boolean })?.first ? "none" : "solid rgb(208, 208, 208) 1px", height: "30px", width: (cell.column.columnDef.meta as { width?: number })?.width ?? 200, fontSize: "12px", padding: "5px" }}
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
            {/* add row and 100k row */}
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