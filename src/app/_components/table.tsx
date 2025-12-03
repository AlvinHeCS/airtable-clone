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
import "./table.css";
import type { Augments, Table, TableRow, View, Filtered, Row, Sort, Filter } from "~/types/types";
import CopyAugment from "./copyAugment";

interface prop {
   tableId: string
}

export default function Table(tableProp: prop) {
    const utils = api.useUtils();   
    const [hidden, setHidden] = useState<Augments>({bool: false, num: 0});
    const [sorted, setSorted] = useState<Augments>({bool: false, num: 0});
    const [filtered, setFiltered] = useState<Filtered>({bool: false, filterNames: "",});
    const [showShowHideColModal, setShowShowHideColModal] = useState<boolean>(false);
    const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
    const [showSortModal, setShowSortModal] = useState<boolean>(false);
    const [showColumnModal, setShowColumnModal] = useState<boolean>(false);
    const [copyViewModal, setCopyViewModal] = useState<boolean>(false);
    const [opaqueBg, setOpaqueBg] = useState<boolean>(false);
    const [selectedView, setSelectedView] = useState<View | null>(null);
    const [showHideButtonPos, setShowHideButtonPos] = useState<{top: number, left: number}>({top: 0, left: 0});
    const [filterButtonPos, setFilterButtonPos] = useState<{top: number, left: number}>({top: 0, left: 0});
    const [sortButtonPos, setSortButtonPos] = useState<{top: number, left: number}>({top: 0, left: 0});
    const [newColButtonPos, setNewColButtonPos] = useState<{top: number, left: number}>({top: 0, left: 0});
    const { data: table } = api.table.getTable.useQuery({tableId: tableProp.tableId});
    const { data: views } = api.table.getViews.useQuery({tableId: tableProp.tableId});
    const { mutateAsync: mutateAsyncRow } = api.table.addRow.useMutation();
    const { mutateAsync: mutateAsyncRow100k } = api.table.add100kRow.useMutation({
      onSuccess: () => {
        if (selectedView) {
        utils.table.rowsAhead.reset({ tableId: tableProp.tableId, viewId: selectedView.id});
        }
      }
    });
    useEffect(() => {
      if (!views || !views[0]) return
      if (selectedView === null) {
        setSelectedView(views[0]);
      } else {
        for (let view of views) {0
          if (view.id === selectedView.id) {
            setSelectedView(view);
          }
        }
      }
    }, [tableProp.tableId, views ?? []])
    // views is unstable needs to have a fallback []


    const {data: rowsAhead, fetchNextPage, hasNextPage, isFetchingNextPage} = api.table.rowsAhead.useInfiniteQuery(
      // need to define selectedView.id on render as it checks the arguments but will only fire the query when selectedView is defined due to enable
      { tableId: tableProp.tableId, viewId: selectedView?.id || ""},
      {
        enabled: !!table && selectedView !== null,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      }
    )  

    // Table Rows
    const rows: TableRow[] = useMemo(() => {
    if (!rowsAhead || !table) return []
    // array of rows now
    const rows = rowsAhead.pages.flatMap((p) => p.rows);
    // turn it into array of objects with header as key and cell value as val
    const formattedRows: TableRow[] = rows.map(row => {
        const rowData: TableRow = { id: row.id };
        // Map each header to the corresponding cell value
        table.headers.forEach((header, i) => {
        const cell = row.cells.find(c => c.colNum === i);
        if (!cell) throw new Error("no cell was found")
        rowData[String(i)] = cell.val;
        });
        return rowData;
    }); 
    return formattedRows
    }, [rowsAhead]);

    // Table Columns
    const columns = useMemo<ColumnDef<TableRow, string>[]>(() => {
      if (!table || !views || !selectedView) return [];
      // intial row number column
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
        meta: { colIndex: -1, first: true },
        size: 40,
      };

      // table Columns
      // each accessorKey must be a unique value
      const sortColIndexes: number[] = selectedView.sorts.map((sort) => {
        return sort.columnIndex
      })
      const filterColIndexes: number[] = selectedView.filters.map((filter) => {
        return filter.columnIndex
      })

      let dataCols: ColumnDef<TableRow, string>[] = table.headers.map((header, i) => ({
        // acessorKey must match a key in my row object 
        accessorKey: String(i),
        header: () => {
          if (table.headerTypes[i] === "string") {
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
        colIndex: i,
        meta: { colIndex: i, second: i === 0 ? true : false, sortHighlight:  sortColIndexes.includes(i) ? true : false, filterHighlight: filterColIndexes.includes(i) ? true: false} as { colIndex: number, second: boolean, sortHighlight: boolean, filterHighlight: boolean},
        // info.column.id = header
        // info.column.header = the react for the header 
        // info.column.columnDef.meta
        // info.row.original
        cell: (info: CellContext<TableRow, string>) => {
          if (table.headerTypes[i] === "string") return <StringCell views={views} viewId={selectedView.id} info={info} tableId={table.id}/>;
          else return <NumCell views={views} info={info} tableId={table.id} viewId={selectedView.id}/>;
        },
      }));
      // filter data cols based on view showings
      dataCols = dataCols.filter((_, i) => {
          return selectedView.showing[i]
      })
      return [rowNumberCol, ...dataCols];
    }, [table?.headerTypes, table?.headers, views, selectedView]);


  // create TanStack table instance
  const tanTable = useReactTable<TableRow>({
    data: rows,
    columns: columns,
    getCoreRowModel: getCoreRowModel(),
  });


    const scrollingRef = useRef<HTMLDivElement>(null);
    const virtualizer = useVirtualizer({
      count: rows.length,
      getScrollElement: () => scrollingRef.current ?? null,
      estimateSize: () => 30,
    });
    // the amount of rows that the visualiser expects has loaded
    const virtualRows = virtualizer.getVirtualItems();

    // get more rows
    useEffect(() => {
      const lastRow = virtualRows[virtualRows.length - 1];
      if (!lastRow) return;
      // if lastRow of expected rows is within -10 of actual loaded allRows and nextpage exist then fetch the next page
      if (lastRow.index >= rows.length - 10 && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }, [virtualRows]);
    
    useEffect(() => {
      if (!selectedView || !table) return
      let notShowing = 0;
      for (const show of selectedView.showing || []) {
        if (!show) notShowing += 1
      }
      if (selectedView.sorts.length > 0) {
        setSorted({bool: true, num: selectedView.sorts.length});
      } else {
        setSorted({bool: false, num: 0})
      }
      if (selectedView.filters.length > 0) {
        const filterNames = selectedView.filters.map((filter) => {
          return table?.headers[filter.columnIndex] || ""
        })
        setFiltered({bool: true, filterNames: [...new Set(filterNames)].join(", ")})
      } else {
        setFiltered({bool: false, filterNames: ""})
      }
      if (notShowing === 0) {
        setHidden({
          bool: false,
          num: 0
        })
      } else {
        setHidden({
          bool: true,
          num: notShowing
        })
      }
    }, [selectedView?.showing, selectedView?.sorts, table?.headers, selectedView?.filters])


  const navigateBetweenCells = (key: string, rowIndex: number, colIndex: number) => {
    let newRow = rowIndex;
    let newCol = colIndex;

    switch (key) {
      case "ArrowUp":
        newRow = Math.max(0, rowIndex - 1);
        break;
      case "ArrowDown":
        newRow = Math.min(rows.length - 1, rowIndex + 1);
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
  const showHideButtonRef = useRef<HTMLButtonElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const sortButtonRef = useRef<HTMLButtonElement>(null);
  const newColButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!showHideButtonRef.current || !filterButtonRef.current || !sortButtonRef.current || !newColButtonRef.current) return;
    const showHideRect = showHideButtonRef.current.getBoundingClientRect();
    const filterRect = filterButtonRef.current.getBoundingClientRect();
    const sortRect = sortButtonRef.current.getBoundingClientRect();
    const newColRect = newColButtonRef.current.getBoundingClientRect();
    
    setShowHideButtonPos({top: showHideRect.top, left: showHideRect.left});
    setFilterButtonPos({top: filterRect.top, left: filterRect.left});
    setSortButtonPos({top: sortRect.top, left: sortRect.left});
    setNewColButtonPos({top: newColRect.top, left: newColRect.left});

  }, [showShowHideColModal, showFilterModal, showSortModal, showColumnModal])

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
                            passed = false
                        }
                        break
                    case "lt":
                        if ((row.cells[f.columnIndex]!.numVal ?? -Infinity) >= Number(f.value)) {
                            passed = false
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
  async function addRow() {
    if (!table || !selectedView || !views) return;

    const newRow = await mutateAsyncRow({ tableId: table.id }) as Row;
    if (!newRow || !newRow.cellsFlat) throw new Error("row failed to be created");
    // need to check if it passes the filters
    for (let view of views) {
        // set the row value for all views to be the cachedRow
      utils.table.rowsAhead.setInfiniteData({ tableId: tableProp.tableId, viewId: view.id },
        (oldData) => {
          if (!oldData) return oldData
          const newPages = oldData.pages.map((page) => {
            return {
              ...page,
              rows: [...page.rows, newRow],
            }
          })
          return {
            ...oldData,
            pages: newPages,
          };
        }
      )
    }
  }

  const add100kRow = () => {
    mutateAsyncRow100k({tableId: table!.id});
  }

  if (!rows || !columns || !table || !selectedView || !views) {
    return (
      <div style={{height: "70vh", display: "flex", width: "100%", justifyContent: "center", alignItems: "center", gap: "10px", color: "rgb(156, 156, 156)"}}>Loading <CircularProgress size="20px"/></div>
    )
  }

  return(
    <div style={{display: "flex", width: "100%", flexDirection: "column", height: "100%"}}>
      {opaqueBg && <div style={{transform: "translateY(-91px) translateX(-60px)", zIndex: 900, border: "solid green 1px", width: "100vw", height: "100vh", position: "fixed", opacity: "50%", background: "black"}}></div>}
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
                fontSize: "14px"
              }} onClick={add100kRow}>100k
          </button>
          {hidden.bool ?            
          <button
            ref={showHideButtonRef}
            className="bell"
            style={{
              width: "140px",
              flexShrink: 0,
              height: "30px",
              borderRadius: "5px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "5px",
              padding: "5px",
              background: "#C3EBFF"
            }}
            onClick={() => (setShowShowHideColModal(true))}
          >
            <img style={{ width: "20px", height: "20px" }} src="/hide.svg" />
            <span style={{ fontWeight: "400", color: "grey", fontSize: "13px" }}>
              {hidden.num} Hidden fields
            </span>
          </button> :
          <button
            ref={showHideButtonRef}
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
          }
          <button
            ref={filterButtonRef}
            className="bell"
            style={{
              width: filtered.bool ? "auto" : "80px",
              flexShrink: 0,
              flexGrow: filtered.bool ? 1 : 0,
              height: "30px",
              borderRadius: "5px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "5px",
              padding: "5px",
              background: filtered.bool ? "#C5E9C6" : "white"
            }}
            onClick={() => setShowFilterModal(true)}
          >
            <img style={{ width: "20px", height: "20px" }} src="/filter.svg" />
            <span style={{ fontWeight: "400", color: "grey", fontSize: "13px" }}>
              {filtered.bool ? `Filtered by ${filtered.filterNames}` : "Filter"}
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
            ref={sortButtonRef}
            className="bell"
            style={{
              width: sorted.bool ? "150px":"80px",
              flexShrink: 0,
              height: "30px",
              borderRadius: "5px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "5px",
              padding: "5px",
              background: sorted.bool ? "#FFDFCB" : "white",
            }}
            onClick={() => setShowSortModal(true)}
          >
            <img style={{ width: "20px", height: "20px" }} src="/sort.svg" />
            <span style={{ fontWeight: "400", color: "grey", fontSize: "13px" }}>
              {sorted.bool ? `Sorted by ${sorted.num} field` : "Sort"}
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
        {showShowHideColModal ? <ShowHideColModal position={showHideButtonPos} tableHeaderTypes={table.headerTypes} view={selectedView} tableHeaders={table.headers} tableId={table.id} setModal={setShowShowHideColModal} /> : null}
        {showFilterModal ? <FilterModal setBgOpaque={setOpaqueBg} copyModal={copyViewModal} setCopyModal={setCopyViewModal} position={filterButtonPos} tableHeaderTypes={table.headerTypes} view={selectedView} tableHeaders={table.headers} tableId={table.id} setModal={setShowFilterModal} /> : null}
        {showSortModal ? <SortModal position={sortButtonPos} tableHeaderTypes={table.headerTypes} view={selectedView} tableHeaders={table.headers} tableId={table.id} setModal={setShowSortModal} /> : null}
        {showColumnModal ? <NewColModal position={newColButtonPos} views={views} view={selectedView} tableId={table.id} setModal={setShowColumnModal} /> : null}
      </div>
    <div style={{display: "flex", height: "100%"}}>
      <GridBar tableId={table.id} view={selectedView} views={views} setSelectedView={setSelectedView} />
      <div ref={scrollingRef} style={{ flex: 1, overflow: "auto", width: "60vw", height: "82vh"}}>
      <table style={{ minWidth: "max-content", borderCollapse: "collapse", display: "block", position: "relative" }}>
        <thead>
          {tanTable.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                // header cells for data
                <th
                  style={{ 
                    zIndex: (header.column.columnDef.meta as { first: boolean, second: boolean }).first ||(header.column.columnDef.meta as { first: boolean, second: boolean }).second ? 101 : 100, 
                    background: "white", 
                    position: "sticky", 
                    left: (header.column.columnDef.meta as { first: boolean, second: boolean }).first 
                    ? "0px"
                    : (header.column.columnDef.meta as { first: boolean, second: boolean }).second
                    ? "50px"
                    : undefined,
                    top: "0", 
                    borderLeft: (header.column.columnDef.meta as { second?: boolean })?.second ? "none" : "solid rgb(208, 208, 208) 1px", 
                    borderTop: "solid rgb(208, 208, 208) 1px", 
                    borderBottom: "solid rgb(208, 208, 208) 1px",   
                    borderRight: (header.column.columnDef.meta as { first?: boolean })?.first ? "none" : "solid rgb(208, 208, 208) 1px", 
                    height: "30px", width: (header.column.columnDef.meta as { first: number }) ? 50 : 200, fontSize: "12px",  }}
                  key={header.id}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
              {/* this header cell is for the add col one */}
              <th style={{ width: "200px", height: "30px", border: "solid rgb(208,208,208) 1px" }}>
                <button
                  ref={newColButtonRef}
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
            <tr key={row.id} className="row">
              {row.getVisibleCells().map(cell => (
                // body cells for data
                <td
                  key={cell.id}
                  data-row={row.index}
                  data-col={(cell.column.columnDef.meta as { colIndex: number }).colIndex}
                  tabIndex={0}
                  style={{ 
                    zIndex: (cell.column.columnDef.meta as { first: boolean; second: boolean }).first || (cell.column.columnDef.meta as { first: boolean; second: boolean }).second? 100 : 0,
                    left: (cell.column.columnDef.meta as { first: boolean; second: boolean }).first
                    ? "0px"
                    : (cell.column.columnDef.meta as { first: boolean; second: boolean }).second
                    ? "50px"
                    : undefined,                    
                    position: (cell.column.columnDef.meta as { second: boolean }).second || (cell.column.columnDef.meta as { first: boolean }).first ? "sticky": "relative", 
                    background: ((cell.column.columnDef.meta as { filterHighlight: boolean }).filterHighlight ? "#E5F8E5" : (cell.column.columnDef.meta as {sortHighlight: boolean}).sortHighlight ? "#FFF3E9" : "white"), 
                    borderLeft: (cell.column.columnDef.meta as { second: boolean }).second ? "none" : "solid rgb(208, 208, 208) 1px", 
                    borderTop: "solid rgb(208, 208, 208) 1px", borderBottom: "solid rgb(208, 208, 208) 1px",   
                    borderRight: (cell.column.columnDef.meta as { first: boolean }).first ? "none" : "solid rgb(208, 208, 208) 1px", height: "30px", 
                    width: (cell.column.columnDef.meta as { first: number }).first ? "50px" : "200px", 
                    fontSize: "12px", 
                    paddingLeft: "5px", 
                    paddingRight: "5px" }}
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
            <td colSpan={selectedView.showing.filter(Boolean).length + 1} style={{ border: "solid rgb(208,208,208) 1px", padding: "5px" }}>
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
      {copyViewModal && <CopyAugment setOpaqueBg={setOpaqueBg} tableId={tableProp.tableId} setModal={setCopyViewModal} views={views} view={selectedView}/>}
    </div>             
 )
}

