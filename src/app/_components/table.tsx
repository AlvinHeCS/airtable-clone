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
import SearchModal from "./searchModal";
import "./table.css";
import type { Augments, Table, TableRow, View, Filtered, Row, CellsFlat, Cell } from "~/types/types";
import CopyAugment from "./copyAugment";
import { faker } from '@faker-js/faker';

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
    const [searchModal, setSearchModal] = useState<boolean>(false);
    const [opaqueBg, setOpaqueBg] = useState<boolean>(false);
    const [selectedView, setSelectedView] = useState<View | null>(null);
    const [showHideButtonPos, setShowHideButtonPos] = useState<{top: number, left: number}>({top: 0, left: 0});
    const [filterButtonPos, setFilterButtonPos] = useState<{top: number, left: number}>({top: 0, left: 0});
    const [sortButtonPos, setSortButtonPos] = useState<{top: number, left: number}>({top: 0, left: 0});
    const [newColButtonPos, setNewColButtonPos] = useState<{top: number, left: number}>({top: 0, left: 0});
    const [searchButtonPos, setSearchButtonPos] = useState<{top: number, left: number}>({top: 0, left: 0});
    const { data: table } = api.table.getTable.useQuery({tableId: tableProp.tableId});
    const { data: views } = api.table.getViews.useQuery({tableId: tableProp.tableId});
    const { mutate: mutateRow, mutateAsync: mutateAsyncRow } = api.table.addRow.useMutation();
    const { mutateAsync: mutateAsyncRow100k, isPending: pending100k } = api.table.add100kRow.useMutation({
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
    // 
    const localTable = useMemo(() => {
      return table
    }, [table])

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
    if (!rowsAhead || !table || !selectedView) return []
    // array of rows now
    const rows = rowsAhead.pages.flatMap((p) => p.rows);
    // turn it into array of objects with header as key and cell value as val
    const formattedRows: TableRow[] = rows.map(row => {
        const rowData: TableRow = { id: row.id };
        // Map each header to the corresponding cell value
        table.headers.forEach((header, i) => {
        const cell = row.cells.find(c => c.colNum === i);
        if (!cell) throw new Error("no cell was found")
        rowData[String(i)] = {val: cell.val, searchHighlight: (cell.val.includes(selectedView.search) && selectedView.search !== "")};
        });
        return rowData;
    }); 
    return formattedRows
    }, [rowsAhead, selectedView]);

    // Table Columns
    const columns = useMemo<ColumnDef<TableRow, string>[]>(() => {
      if (!table || !views || !selectedView) return [];
      // intial row number column
      const rowNumberCol: ColumnDef<TableRow, string> = {
        id: "rowNumber",
        header: () => {
          return(
            <div style={{ width: "81px", display: "flex", padding: "5px", paddingLeft: "15px", justifyContent: "flex-start"}}>
              <img style={{width: "18px", height: "18px"}} src="/checkBox.svg"></img>
            </div>
          )
        },
        cell: (info) => (
          <div style={{ color: "#1D1F26", width: "81px", textAlign: "start", padding: "5px", paddingLeft: "20px"}}>
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
          return (
            <div style={{ color: "#1D1F26", display: "flex", justifyContent: "flex-start", alignItems: "center", gap: "4px", padding: "5px", }}>
              <img
                src={table.headerTypes[i] === "string" ? "/letter.svg" : "/hashtag.svg"}
                alt="icon"
                style={{ width: "14px", height: "14px" }}
              />
              <span>{header}</span>
            </div>
          );
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

const { rows: tableRows } = tanTable.getRowModel();

    const scrollingRef = useRef<HTMLDivElement>(null);
    const virtualizer = useVirtualizer({
      count: hasNextPage ? rows.length + 1 : rows.length,
      getScrollElement: () => scrollingRef.current ?? null,
      estimateSize: () => 32,
      overscan: 50,
    });

    // the amount of rows that the visualiser expects has loaded
    const virtualRows = virtualizer.getVirtualItems();
    const totalSize = virtualizer.getTotalSize();

    const paddingTop = virtualRows.length > 0 ? virtualRows[0]?.start || 0 : 0;
    const paddingBottom = virtualRows.length > 0 ? totalSize - (virtualRows[virtualRows.length - 1]?.end || 0) : 0;

    // get more rows
    useEffect(() => {
      const lastRow = virtualRows[virtualRows.length - 1];
      if (!lastRow || !hasNextPage || isFetchingNextPage) return;

      const totalRowCount = virtualizer.options.count; 

      if (lastRow.index >= totalRowCount - 100) { 
        fetchNextPage();
      }
    }, [virtualRows, hasNextPage, isFetchingNextPage, fetchNextPage, virtualizer]);
    
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
      case "Tab":
        if (newCol === table!.headers.length - 1 && newRow === rows.length - 1) {
          newCol = 0;
          newRow = 0;

        } else if (newCol === table!.headers.length - 1) {
          newCol = 0;
          newRow = rowIndex + 1
        } else {
          newCol = colIndex + 1
        }
        break;
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
    const inputElement = cellElement?.querySelector('input, textarea') as HTMLElement | null;

    if (inputElement) {
        inputElement.focus();
      if (inputElement instanceof HTMLInputElement) {
          inputElement.select();
      } else {
        cellElement?.focus();
      }
    }
  }
  const showHideButtonRef = useRef<HTMLButtonElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const sortButtonRef = useRef<HTMLButtonElement>(null);
  const newColButtonRef = useRef<HTMLButtonElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!showHideButtonRef.current || !filterButtonRef.current || !sortButtonRef.current || !newColButtonRef.current || !searchButtonRef.current) return;
    const showHideRect = showHideButtonRef.current.getBoundingClientRect();
    const filterRect = filterButtonRef.current.getBoundingClientRect();
    const sortRect = sortButtonRef.current.getBoundingClientRect();
    const newColRect = newColButtonRef.current.getBoundingClientRect();
    const searchRect = searchButtonRef.current.getBoundingClientRect();
    
    setShowHideButtonPos({top: showHideRect.top, left: showHideRect.left});
    setFilterButtonPos({top: filterRect.top, left: filterRect.left});
    setSortButtonPos({top: sortRect.top, left: sortRect.left});
    setNewColButtonPos({top: newColRect.top, left: newColRect.left});
    setSearchButtonPos({top: searchRect.top, left: searchRect.left})
  }, [showShowHideColModal, showFilterModal, showSortModal, showColumnModal, searchModal])


  async function addRow() {
    if (!table || !selectedView || !views) return;

    const newRowId = `${crypto.randomUUID()}`
    const newRowNum = (table.numRows ?? 1) - 1
    const cellsData: Cell[] = [];
    const cellsFlat: CellsFlat = [];
    // create cells
    table.headers.forEach((_, i) => {
      if (table.headerTypes[i] === "string") {
        const val = faker.person.fullName();
        cellsData.push({ colNum: i, val, numVal: null, rowId: newRowId, id: `${i}_${crypto.randomUUID()}`});
        cellsFlat.push(val)
      } else {
        const numVal = faker.number.int({ min: 1, max: 100 });
        const val = String(numVal);
        cellsData.push({ colNum: i, val, numVal, rowId: newRowId, id: `${i}_${crypto.randomUUID()}`});
        cellsFlat.push(numVal)
      }
    });
    // create row first
    const newOptimisticRow: Row = {
      id: newRowId,
      tableId: table.id,
      rowNum: newRowNum,
      cellsFlat: cellsFlat,
      cells: cellsData
    }

    // update table 
    mutateRow({ cellsData: cellsData, tableId: table.id, cellsFlat: cellsFlat, rowId: newRowId, rowNum: newRowNum });
    utils.table.getTable.setData({tableId: table.id}, (prev) => {
      if (!prev) return prev
      return {
        ...prev,
        numRows: prev.numRows + 1
      }
    })

    // optimistically update rows
    for (let view of views) {
      utils.table.rowsAhead.setInfiniteData({ tableId: tableProp.tableId, viewId: view.id },
        (oldData) => {
          if (!oldData) return oldData
          const newPages = oldData.pages.map((page) => {
            return {
              ...page,
              rows: [...page.rows, newOptimisticRow],
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
      {opaqueBg && <div style={{transform: "translateY(-91px) translateX(-60px)", zIndex: 900, width: "100vw", height: "100vh", position: "fixed", opacity: "50%", background: "black"}}></div>}
      <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", borderRight: "solid grey 0.2px", borderBottom:"solid rgba(234, 234, 234, 1) 0.5px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", height: "50px", paddingLeft: "10px"}}>
          <button
            className="augmentButtons"
            style={{
              width: "30px",
              height: "27px",
              borderRadius: "2px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            <img style={{ width: "15px", height: "20px" }} src="/hamburger.svg" />
          </button>


          <button
            className="augmentButtons"
            style={{
              height: "27px",
              borderRadius: "2px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "10px",
              padding: "5px",
              width: "120px"
            }}
          >
            <img style={{ width: "15px", height: "12px" }} src="/bTable.png" />
            <span style={{ fontWeight: "500", fontSize: "13px" }}>Grid view</span>
            <img style={{ width: "10px", height: "10px" }} src="/arrowD.svg" />
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "5px", paddingLeft: "10px", paddingRight: "10px"}}>
          <button              
          className="augmentButtons"
              style={{
                width: pending100k ? "100px":"70px",
                flexShrink: 0,
                height: "27px",
                borderRadius: "2px",
                display: "flex",
                color: "grey",
                justifyContent: "center",
                alignItems: "center",
                gap: "5px",
                padding: "5px",
                fontSize: "14px",
              }} 
              onClick={add100kRow}
              disabled={pending100k}
              >
                {pending100k ? "adding rows":"100k"}
          </button>
          {hidden.bool ?            
          <button
            ref={showHideButtonRef}
            className="augmentButtons"
            style={{
              width: "140px",
              flexShrink: 0,
              height: "27px",
              borderRadius: "5px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "5px",
              padding: "5px",
              background: "#C3EBFF",
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
            className="augmentButtons"
            style={{
              width: "100px",
              flexShrink: 0,
              height: "27px",
              borderRadius: "2px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "5px",
              gap: "5px",
            }}
            onClick={() => (setShowShowHideColModal(true))}
          >
            <img style={{ width: "15px", height: "15px" }} src="/hide.svg" />
            <span style={{ fontWeight: "400", color: "grey", fontSize: "13px" }}>
              Hide fields
            </span>
          </button>
          }
          <button
            ref={filterButtonRef}
            className="augmentButtons"
            style={{
              width: filtered.bool ? "auto" : "70px",
              flexShrink: 0,
              flexGrow: filtered.bool ? 1 : 0,
              height: "27px",
              borderRadius: "2px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "5px",
              padding: "5px",
              background: filtered.bool ? "#C5E9C6" : "white"
            }}
            onClick={() => setShowFilterModal(true)}
          >
            <img style={{ width: "15px", height: "15px" }} src="/filter.svg" />
            <span style={{ fontWeight: "400", color: "grey", fontSize: "13px" }}>
              {filtered.bool ? `Filtered by ${filtered.filterNames}` : "Filter"}
            </span>
          </button>

          <button
            className="augmentButtons"
            style={{
              width: "80px",
              flexShrink: 0,
              height: "27px",
              borderRadius: "2px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "5px",
              padding: "5px",
            }}
          >
            <img style={{ width: "15px", height: "15px" }} src="/groupStuff.svg" />
            <span style={{ fontWeight: "400", color: "grey", fontSize: "13px" }}>
              Groups
            </span>
          </button>

          <button
            ref={sortButtonRef}
            className="augmentButtons"
            style={{
              width: sorted.bool ? "150px":"70px",
              flexShrink: 0,
              height: "27px",
              borderRadius: "2px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "5px",
              padding: "5px",
              background: sorted.bool ? "#FFDFCB" : "white",
            }}
            onClick={() => setShowSortModal(true)}
          >
            <img style={{ width: "15px", height: "15px" }} src="/sort.svg" />
            <span style={{ fontWeight: "400", color: "grey", fontSize: "13px" }}>
              {sorted.bool ? `Sorted by ${sorted.num} field` : "Sort"}
            </span>
          </button>

          <button
            className="augmentButtons"
            style={{
              width: "70px",
              flexShrink: 0,
              height: "27px",
              borderRadius: "2px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "5px",
              padding: "5px",
              background: "white",
            }}
          >
            <img style={{ width: "15px", height: "15px" }} src="/color.svg" />
            <span style={{ fontWeight: "400", color: "grey", fontSize: "13px" }}>
              Color
            </span>
          </button>

          <button
            className="augmentButtons"
            style={{
              width: "30px",
              flexShrink: 0,
              height: "27px",
              borderRadius: "2px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "5px",
              padding: "5px",
              background: "white",
            }}
          >
            <img style={{ width: "15px", height: "15px" }} src="/rowHeight.svg" />
            <span style={{ fontWeight: "400", color: "grey", fontSize: "13px" }}>
            </span>
          </button>

          <button
            className="augmentButtons"
            style={{
              width: "130px",
              flexShrink: 0,
              height: "27px",
              borderRadius: "2px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "5px",
              padding: "5px",
              background: "white",
            }}
          >
            <img style={{ width: "15px", height: "15px" }} src="/share.svg" />
            <span style={{ fontWeight: "400", color: "grey", fontSize: "13px" }}>
              Share and sync
            </span>
          </button>

          <button
            className="augmentButtons"
            style={{
              width: "30px",
              flexShrink: 0,
              height: "27px",
              borderRadius: "2px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "5px",
              background: "white",
            }}
            ref={searchButtonRef}
            onClick={() => setSearchModal(true)}
          >
            <img style={{ width: "15px", height: "15px" }} src="/search2.svg" />
            <span style={{ fontWeight: "400", color: "grey", fontSize: "13px" }}>
            </span>
          </button>
        </div>
        {showShowHideColModal ? <ShowHideColModal position={showHideButtonPos} tableHeaderTypes={table.headerTypes} view={selectedView} tableHeaders={table.headers} tableId={table.id} setModal={setShowShowHideColModal} /> : null}
        {showFilterModal ? <FilterModal setBgOpaque={setOpaqueBg} copyModal={copyViewModal} setCopyModal={setCopyViewModal} position={filterButtonPos} tableHeaderTypes={table.headerTypes} view={selectedView} tableHeaders={table.headers} tableId={table.id} setModal={setShowFilterModal} /> : null}
        {showSortModal ? <SortModal position={sortButtonPos} tableHeaderTypes={table.headerTypes} view={selectedView} tableHeaders={table.headers} tableId={table.id} setModal={setShowSortModal} /> : null}
        {showColumnModal ? <NewColModal position={newColButtonPos} views={views} view={selectedView} tableId={table.id} setModal={setShowColumnModal} /> : null}
        {searchModal ? <SearchModal setModal={setSearchModal} position={searchButtonPos} view={selectedView} tableId={table.id} /> : null}
      </div>
    <div style={{display: "flex", height: "100%" }}>
      <GridBar tableId={table.id} view={selectedView} views={views} setSelectedView={setSelectedView} />
      <div ref={scrollingRef} style={{ flex: 1, overflow: "auto", width: "60vw", height: "82vh", background: "#F7F8FC"}}>
        <div style={{paddingBottom: "50px", paddingRight: "70px", width: "fit-content", minWidth: "100%"}}>
        <table style={{ minWidth: "max-content"}}>
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
                      ? "81px"
                      : undefined,
                      top: "0", 
                      borderLeft: (header.column.columnDef.meta as { second?: boolean })?.second ? "none" : "solid #DEE0E2 1px", 
                      borderTop: "solid #DEE0E2 1px", 
                      borderBottom: "solid #DEE0E2 1px",   
                      borderRight: (header.column.columnDef.meta as { first?: boolean })?.first ? "none" : "solid #DEE0E2 1px", 
                      boxShadow: (header.column.columnDef.meta as { second?: boolean })?.second ? "inset -4px 0 4px -4px rgba(0, 0, 0, 0.4)" : "none",
                      height: "32px", 
                      width: (header.column.columnDef.meta as { first: number }) ? "50px" : "180px", 
                      fontSize: "12.5px",
                    }}
                      key={header.id}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
                {/* this header cell is for the add col one */}
                <th style={{ width: "100px", height: "32px", border: "solid #DEE0E2 1px", background: "white" }}>
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
          {paddingTop > 0 && (
              <tr>
                <td style={{ height: `${paddingTop}px` }} />
              </tr>
            )}
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const row = tableRows[virtualRow.index];
              if (!row)     
                return (
                <tr key={`loading-${virtualRow.index}`} className="row">
                  <td className="row" style={{height: `${virtualRow.size}px`, width:  "100%"}}>Loading Row...</td>
                </tr>
                );
              return(
                <tr key={row.id} className="row" style={{height: `${virtualRow.size}px`}}>
                  {row.getVisibleCells().map(cell => {
                    // body cells for data
                    const accessorKey = cell.column.id;
                    const cellData = row.original[accessorKey];
                    const isSearchHighlight = (cellData as Record<string, string | boolean>)?.searchHighlight as boolean || false;

                    return (
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
                          ? "81px"
                          : undefined, 
                          position: (cell.column.columnDef.meta as { second: boolean }).second || (cell.column.columnDef.meta as { first: boolean }).first ? "sticky": "relative", 
                          background: isSearchHighlight ? "#FFF4D4" : ((cell.column.columnDef.meta as { filterHighlight: boolean }).filterHighlight ? "#E5F8E5" : (cell.column.columnDef.meta as {sortHighlight: boolean}).sortHighlight ? "#FFF3E9" : "white"),
                          borderLeft: (cell.column.columnDef.meta as { second: boolean }).second ? "none" : "solid #DEE0E2 1px", 
                          borderTop: "solid #DEE0E2 1px", borderBottom: "solid #DEE0E2 1px",   
                          borderRight: (cell.column.columnDef.meta as { first: boolean }).first ? "none" : "solid #DEE0E2 1px", 
                          height: `${virtualRow.size}px`, 
                          boxShadow: (cell.column.columnDef.meta as { second?: boolean })?.second ? "inset -4px 0 4px -4px rgba(0, 0, 0, 0.4)" : "none",
                          width: (cell.column.columnDef.meta as { first: number }).first ? "50px" : "180px", 
                          textAlign: (cell.column.columnDef.meta as { first: number }) ? "center" : "left",
                          fontSize: "12.5px", 
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Tab") {
                              e.preventDefault();      
                              navigateBetweenCells("Tab", row.index, (cell.column.columnDef.meta as { colIndex: number })?.colIndex ?? 0);
                              return;
                            }

                            // other keys
                            if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
                              e.preventDefault();
                              navigateBetweenCells(e.key, row.index, (cell.column.columnDef.meta as { colIndex: number })?.colIndex ?? 0);
                            }
                          }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    )
                  })}
              </tr>
            )
            })}
          {paddingBottom > 0 && (
              <tr>
                <td style={{ height: `${paddingBottom}px` }} />
              </tr>
            )}
          </tbody>
          {/* add row */}
          <tfoot>
            <tr>
              <td colSpan={selectedView.showing.filter(Boolean).length + 1} style={{ border: "solid rgba(228, 228, 228, 1) 1px", padding: "5px", height: "32px", background: "white"}}>
                <div style={{ display: "flex", gap: "4px", paddingLeft: "10px"}}>
                  <button
                    className="addRowButton"
                    onClick={addRow}
                    style={{width: "100%", display: "flex", justifyContent: "flex-start", alignItems: "center"}}
                  >
                    <img style={{ height: "15px", width: "15px" }} src="/plus2.svg" />
                  </button>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
        </div>
      </div>
      </div>
      {copyViewModal && <CopyAugment setOpaqueBg={setOpaqueBg} tableId={tableProp.tableId} setModal={setCopyViewModal} views={views} view={selectedView}/>}
    </div>             
 )
}

