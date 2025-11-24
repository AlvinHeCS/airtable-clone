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
import GridBar from "~/app/_components/gridBar"
import FilterModal from "./filterModal";

interface prop {
    tableName: string;
    baseId: string;
}

const filterTypes = [
  "contains",
  "not_contains",
  "eq",
  "gt",
  "lt",
  "empty",
  "not_empty",
] as const;

type OperatorType = typeof filterTypes[number];

type Filter = {
  id: string;
  type: OperatorType;
  value: string;
  tableId: string;
  columnIndex: number;
};

type Table = {
  id: string;
  baseId: string;
  headers: string[];
  headerTypes: number[];
  numRows: number;
  name: string;
  filters: Filter[]
}

type TableRow = Record<string, string> & { rowId: string };


export default function Table(tableProp: prop) {
    const utils = api.useUtils();    
  
      const {
        data: getTableWithRowsAheadData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
      } = api.table.getTableWithRowsAhead.useInfiniteQuery(
        {
          baseId: tableProp.baseId,
          tableName: tableProp.tableName,
        },
        {
          getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
        }
      );
      const table = getTableWithRowsAheadData?.pages?.[0]?.table;

      const allRows = useMemo(() => {
        return getTableWithRowsAheadData?.pages.flatMap((p) => p.rows) ?? [];
      }, [getTableWithRowsAheadData]);

    // every time ableName swaps it first clears the cache then refetches
    useEffect(() => {
      utils.table.getTableWithRowsAhead.setData(
        {         baseId: tableProp.baseId,
        tableName: tableProp.tableName },
        undefined
      );
      utils.table.getTableWithRowsAhead.invalidate({
        baseId: tableProp.baseId,
        tableName: tableProp.tableName
      });
    }, [tableProp.baseId, tableProp.tableName]);    
    
    const [localHeaders, setLocalHeaders] = useState<string[]>([]);
    const [localHeaderTypes, setLocalHeadersTypes] = useState<number[]>([]);
    const [data, setData] = useState<TableRow[]>([]);

    const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
    const [showColumnModal, setShowColumnModal] = useState<boolean>(false);

    const { mutateAsync: mutateAsyncRow } = api.table.addRow.useMutation();

    const { mutateAsync: mutateAsyncRow100k } = api.table.add100kRow.useMutation({
      onSuccess: () => {
        utils.table.getTableWithRowsAhead.setData(
          {         baseId: tableProp.baseId,
          tableName: tableProp.tableName },
          undefined
        );
        utils.table.getTableWithRowsAhead.invalidate({
          baseId: tableProp.baseId,
          tableName: tableProp.tableName
        });
      }
    });

    const scrollingRef = useRef<HTMLDivElement>(null);
    const virtualizer = useVirtualizer({
      count: allRows.length,
      getScrollElement: () => scrollingRef.current ?? null,
      estimateSize: () => 40,
    });
    const virtualRows = virtualizer.getVirtualItems();

    // get rows
    useEffect(() => {
      const lastRow = virtualRows[virtualRows.length - 1];
      if (!lastRow) return;
      if (lastRow.index >= allRows.length - 10 && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }, [virtualRows]);
    
    // set local table information
    useEffect(() => {
      if (!table || !allRows) return;
    
      const newData: TableRow[] = allRows.map(row => {
        const rowData: TableRow = { rowId: row.id };
    
        // Map each header to the corresponding cell value
        table.headers.forEach((header, i) => {
          const cell = row.cells.find(c => c.colNum === i);
          rowData[header] = cell?.val ?? "";
        });
    
        return rowData;
      });
    
      setData(newData);
      setLocalHeaders(table.headers);
      setLocalHeadersTypes(table.headerTypes);
    
    }, [table, allRows]);


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
        if (localHeaderTypes[i] === 0) return <StringCell info={info} tableId={table!.id} tableName={table!.name} baseId={table!.baseId}/>;
        else return <NumCell info={info} tableId={table!.id} tableName={table!.name} baseId={table!.baseId} />;
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
        newCol = Math.min(table!.headers.length - 1, colIndex + 1);
        break;
      default:
        return;
    }  
  
    const cellElement = document.querySelector(
      `td[data-row='${newRow}'][data-col='${newCol}']`
    ) as HTMLElement | null;
    cellElement?.focus();
  }

  async function addRow() {
    if (!table) return;
  
    const newRow = await mutateAsyncRow({ tableId: table.id });
  
    const rowData: TableRow = { rowId: newRow!.id };
  
    for (let i = 0; i < table.headers.length; i++) {
      const header = table.headers[i] || "";
      // find the cell for this column
      const cell = newRow!.cells.find(c => c.colNum === i);
      rowData[header] = cell?.val ?? "";
    }
  
    setData(prevData => [...prevData, rowData]);
  }
  const add100kRow = () => {
    mutateAsyncRow100k({tableId: table!.id});
  }

    if (!allRows || allRows.length === 0) {
      return (
        <div style={{height: "70vh", display: "flex", width: "100%", justifyContent: "center", alignItems: "center", gap: "10px", color: "rgb(156, 156, 156)"}}>Fetching rows <CircularProgress size="20px"/></div>
      )
    }

    return(
      <div style={{display: "flex", width: "100%", flexDirection: "column", height: "100%"}}>
        <div style={{display: "flex", alignItems: "center", justifyContent: "space-between"}}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", height: "50px"}}>
            <button
              className="bell"
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "5px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center"
              }}
            >
              <img style={{ width: "15px", height: "20px" }} src="/hamburger.svg" />
            </button>

            <button
              className="bell"
              style={{
                height: "30px",
                borderRadius: "5px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "5px",
                padding: "5px"
              }}
            >
              <img style={{ width: "18px", height: "15px" }} src="/bTable.png" />
              <span style={{ fontWeight: "500", fontSize: "13px" }}>Grid view</span>
              <img style={{ width: "10px", height: "10px" }} src="/arrowD.svg" />
            </button>
          </div>
          <button onClick={add100kRow}>100k</button>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            {/* Hide */}
            <button
              className="bell"
              style={{
                width: "100px",
                flexShrink: 0,
                height: "30px",
                borderRadius: "5px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "5px",
                padding: "5px",
              }}
            >
              <img style={{ width: "20px", height: "20px" }} src="/hide.svg" />
              <span style={{ fontWeight: "400", color: "grey", fontSize: "13px" }}>
                Hide fields
              </span>
            </button>

            {/* Filter */}
            <button
              className="bell"
              style={{
                width: "80px",
                flexShrink: 0,
                height: "30px",
                borderRadius: "5px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "5px",
                padding: "5px",
              }}
              onClick={() => setShowFilterModal(true)}
            >
              <img style={{ width: "20px", height: "20px" }} src="/filter.svg" />
              <span style={{ fontWeight: "400", color: "grey", fontSize: "13px" }}>
                Filter
              </span>
            </button>

            {/* All remaining buttons */}
            {[
              { src: "/groupStuff.svg", label: "Groups" },
              { src: "/sort.svg", label: "Sort" },
              { src: "/color.svg", label: "Color" },
              { src: "/rowHeight.svg" },
              { src: "/share.svg", label: "Share and sync", width: "130px" },
              { src: "/search2.svg" },
            ].map((btn, i) => (
              <button
                key={i}
                className="bell"
                style={{
                  width: btn.width || "80px",
                  flexShrink: 0,
                  height: "30px",
                  borderRadius: "5px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "5px",
                  padding: "5px",
                }}
              >
                <img style={{ width: "20px", height: "20px" }} src={btn.src} />
                {btn.label && (
                  <span
                    style={{
                      fontWeight: "400",
                      color: "grey",
                      fontSize: "13px",
                    }}
                  >
                    {btn.label}
                  </span>
                )}
              </button>
            ))}
          </div>
          {showFilterModal ? <FilterModal tableFilters={table!.filters} tableHeaders={table!.headers} tableId={table!.id} setData={setData} setModal={setShowFilterModal} tableName={table!.name} baseId={table!.baseId}/> : null}
          {showColumnModal ? <NewColModal
            tableId={{
              id: table!.id,
              tableName: table!.name,
              baseId: table!.baseId,
              setModal: setShowColumnModal,
              setData,
              setLocalHeaders,
              setLocalHeaderTypes: setLocalHeadersTypes,
            }}
          /> : null}
        </div>
      <div style={{display: "flex", height: "100%"}}>
        <GridBar />
        <div ref={scrollingRef} style={{ flex: 1, overflow: "auto", width: "60vw", height: "82vh"}}>
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
                     onClick={() => setShowColumnModal(true)}
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
               <td colSpan={table!.headers.length + 1} style={{ border: "solid rgb(208,208,208) 1px", padding: "5px" }}>
                 <div style={{ display: "flex", gap: "4px" }}>
                   <button
                     onClick={addRow}
                     style={{ height: "31px", width: "81px", display: "flex", justifyContent: "center", alignItems: "center"}}
                   >
                     <img style={{ height: "20px", width: "20px" }} src="/plus2.svg" />
                   </button>
                 </div>
               </td>
             </tr>
           </tfoot>
         </table>
        </div> 
        </div> 
      </div>              
  )
}