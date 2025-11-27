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
import SortModal from "./sortModal";
import ShowHideColModal from "./showHideColModal";
import type { Table, TableRow } from "~/types/types";

interface prop {
    tableName: string;
    baseId: string;
}

export default function Table(tableProp: prop) {
    const utils = api.useUtils();    
    
    const [viewName, setViewName] = useState<string>("Grid view");
  // this is the shape of getTableWIthRowsAhead
  // {
  //   pages: {
  //     table: Table;
  //     view: View;
  //     rows: Row[]; size is 200 as long as theres more
  //     nextCursor: number | null;
  //   }[],
  //   pageParams: (number | undefined)[];
  // }

    const {
      data: getTableAndViewWithRowsAhead,
      fetchNextPage,
      hasNextPage,
      isFetchingNextPage,
    } = api.table.getTableAndViewWithRowsAhead.useInfiniteQuery(
      {
        baseId: tableProp.baseId,
        tableName: tableProp.tableName,
        viewName: viewName
      },
      {
        getNextPageParam: (lastPage) => {
          return lastPage.nextCursor
        }
      }
    );
    const table = getTableAndViewWithRowsAhead?.pages?.[0]?.table;
    const { data: allViews, isLoading: viewsLoading } = api.table.getViews.useQuery(
      { tableId: table?.id ?? "" }, 
      { enabled: !!table }           
    );
    const view = getTableAndViewWithRowsAhead?.pages?.[0]?.view;
    const allRows = useMemo(() => {
      return getTableAndViewWithRowsAhead?.pages.flatMap((p) => p.rows) ?? [];
    }, [getTableAndViewWithRowsAhead]);
    
    const [localHeaders, setLocalHeaders] = useState<string[]>([]);
    const [localHeaderTypes, setLocalHeadersTypes] = useState<number[]>([]);
    const [localShowing, setLocalShowing] = useState<boolean[]>([]);
    const [data, setData] = useState<TableRow[]>([]);

    const [showShowHideColModal, setShowShowHideColModal] = useState<boolean>(false);
    const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
    const [showSortModal, setShowSortModal] = useState<boolean>(false);
    const [showColumnModal, setShowColumnModal] = useState<boolean>(false);

    const { mutateAsync: mutateAsyncRow } = api.table.addRow.useMutation();

    const { mutateAsync: mutateAsyncRow100k } = api.table.add100kRow.useMutation({
      onSuccess: () => {
        utils.table.getTableAndViewWithRowsAhead.invalidate({
          baseId: tableProp.baseId,
          tableName: tableProp.tableName,
          viewName: viewName,
        });
      }
    });

    const scrollingRef = useRef<HTMLDivElement>(null);
    const virtualizer = useVirtualizer({
      count: allRows.length,
      getScrollElement: () => scrollingRef.current ?? null,
      estimateSize: () => 30,
    });
    // the amount of rows that the visualiser expects has loaded
    const virtualRows = virtualizer.getVirtualItems();

    // get rows
    useEffect(() => {
      const lastRow = virtualRows[virtualRows.length - 1];
      if (!lastRow) return;
      // if lastRow of expected rows is within -10 of actual loaded allRows and nextpage exist then fetch the next page
      if (lastRow.index >= allRows.length - 10 && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }, [virtualRows]);
    
    // anytime new table, or allRows is loaded then set local table information (happens everytime table is swapped)
    useEffect(() => {
      if (!table || !allRows || !view) return;
      
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
      setLocalShowing(view.showing);
    }, [table, allRows]);

    


  // create columns dynamically
  const columns = useMemo<ColumnDef<TableRow, string>[]>(() => {
    if (localHeaderTypes.length === 0 || localHeaderTypes.length === 0 || !table) return [];

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

    let dataCols = localHeaders.map((header, i) => ({
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
        if (localHeaderTypes[i] === 0) return <StringCell views={allViews ?? []} viewName={viewName} info={info} tableId={table!.id} tableName={table!.name} baseId={table!.baseId}/>;
        else return <NumCell views={allViews ?? []} viewName={viewName} info={info} tableId={table.id} tableName={table!.name} baseId={table!.baseId} />;
      },
    }));
    dataCols = dataCols.filter((_, i) => {
        return localShowing[i]
    })
    return [rowNumberCol, ...dataCols];
  }, [localHeaders, localHeaderTypes, localShowing, viewName]);

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
    if (!table || !view || !allViews) return;

    const newRow = await mutateAsyncRow({ tableId: table.id });
    if (!newRow) throw new Error("row failed to be created");


  // row that the cache is updated with
  const cachedRow = {
    id: newRow.id,
    rowNum: newRow.rowNum,
    tableId: table.id,
    // cellsFlat can be left like this because when a new sort is created ir refetches the table which reupdates the cache
    // pulling the correct cellsFlat from the db
    cellsFlat: {},
    cells: newRow.cells
  };

  // row used to update the local table
  const rowData: TableRow = { rowId: newRow.id };
  for (let i = 0; i < table.headers.length; i++) {
    const header = table.headers[i] || "";
    const cell = newRow.cells.find(c => c.colNum === i);
    rowData[header] = cell?.val ?? "";
  }

  let passed = true;

  for (const f of view.filters) {
    const header = table.headers[f.columnIndex] || "";
    const cellVal = rowData[header] ?? "";

    switch (f.type) {
      case "contains":
        if (!cellVal.includes(f.value)) passed = false;
        break;
      case "not_contains":
        if (cellVal.includes(f.value)) passed = false;
        break;
      case "eq":
        if (cellVal !== f.value) passed = false;
        break;
      case "empty":
        if (cellVal !== "") passed = false;
        break;
      case "not_empty":
        if (cellVal === "") passed = false;
        break;
      case "gt":
        if (Number(cellVal) <= Number(f.value)) passed = false;
        break;
      case "lt":
        if (Number(cellVal) >= Number(f.value)) passed = false;
        break;
    }

    if (!passed) break; 
  }
  if (passed) {
    // add row to local rows
    setData(prev => [...prev, rowData]);


  allViews.forEach((view, _) => {
    // update cache 
    console.log("updating this view: ", view.name);
    utils.table.getTableAndViewWithRowsAhead.setInfiniteData({ baseId: tableProp.baseId, tableName: tableProp.tableName, viewName: view.name },
      (oldData) => {
        if (!oldData) {
          return {
            pages: [
              {
                table,
                view,
                rows: [cachedRow],
                nextCursor: null,
              },
            ],
            pageParams: [],
          };
        }
        const pages = [...oldData.pages];
        const lastPageIndex = pages.length - 1;
        const lastPage = pages[lastPageIndex];

        if (!lastPage) throw new Error("last page not found");
        pages[lastPageIndex] = {
          ...lastPage,
          view: lastPage.view,
          table: lastPage.table, 
          rows: [...lastPage.rows, cachedRow],
          nextCursor: lastPage.nextCursor ?? null,
        };

        return {
          pages,
          pageParams: oldData.pageParams,
        };
      }
    );
  });
  }
}
  const add100kRow = () => {
    mutateAsyncRow100k({tableId: table!.id});
  }

    if (!allRows || !table || !view || !allViews) {
      return (
        <div style={{height: "70vh", display: "flex", width: "100%", justifyContent: "center", alignItems: "center", gap: "10px", color: "rgb(156, 156, 156)"}}>Fetching rows <CircularProgress size="20px"/></div>
      )
    }

    // view should be defined when at this stage right
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
              onClick={() => (setShowShowHideColModal(true))}
            >
              <img style={{ width: "20px", height: "20px" }} src="/hide.svg" />
              <span style={{ fontWeight: "400", color: "grey", fontSize: "13px" }}>
                Hide fields
              </span>
            </button>

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
            >
              <img style={{ width: "20px", height: "20px" }} src="/groupStuff.svg" />
              <span style={{ fontWeight: "400", color: "grey", fontSize: "13px" }}>
                Groups
              </span>
            </button>

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
              onClick={() => setShowSortModal(true)}
            >
              <img style={{ width: "20px", height: "20px" }} src="/sort.svg" />
              <span style={{ fontWeight: "400", color: "grey", fontSize: "13px" }}>
                Sort
              </span>
            </button>

            {[
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
          {showShowHideColModal ? <ShowHideColModal view={view} tableName={table.name} baseId={table.baseId} localShowing={localShowing} setLocalShowing={setLocalShowing} tableHeaders={localHeaders} tableId={table.id} setModal={setShowShowHideColModal} /> : null}
          {showFilterModal ? <FilterModal view={view} tableHeaders={table.headers} tableId={table.id} setData={setData} setModal={setShowFilterModal} tableName={table.name} baseId={table.baseId}/> : null}
          {showSortModal ? <SortModal view={view} tableHeaders={table!.headers} tableId={table!.id} setData={setData} setModal={setShowSortModal} tableName={table.name} baseId={table.baseId}/> : null}
          {showColumnModal ? <NewColModal views={allViews} view={view} id={table!.id} tableName={table!.name} baseId={table!.baseId} setModal={setShowColumnModal} setData={setData} setLocalHeaders={setLocalHeaders} setLocalHeaderTypes={setLocalHeadersTypes} setLocalShowing={setLocalShowing}/> : null}
        </div>
      <div style={{display: "flex", height: "100%"}}>
        <GridBar tableId={table.id} setViewName={setViewName} tableName={table.name} baseId={table.baseId} viewName={viewName}/>
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
           {/* add row */}
           <tfoot>
             <tr>
               <td colSpan={localShowing.filter(Boolean).length + 1} style={{ border: "solid rgb(208,208,208) 1px", padding: "5px" }}>
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