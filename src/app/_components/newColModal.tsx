"use client"

import { useState } from "react"
import { api } from "~/trpc/react"
import type { TableRow, View } from "~/types/types";

interface prop {
    id: string;
    tableName: string;
    baseId: string;
    setModal: React.Dispatch<React.SetStateAction<boolean>>;
    setData: React.Dispatch<React.SetStateAction<TableRow[]>>;
    setLocalHeaders: React.Dispatch<React.SetStateAction<string[]>>;
    setLocalHeaderTypes: React.Dispatch<React.SetStateAction<number[]>>;
    setLocalShowing: React.Dispatch<React.SetStateAction<boolean[]>>;
    view: View;
}

export default function NewColModal(NewColModalProp: prop) {
    const [newHeaderVal, setNewHeaderVal] = useState<string>("");
    const [newHeaderType, setNewHeaderType] = useState<number>(0);
    const utils = api.useUtils();
    const { mutateAsync: mutateAsyncCol } = api.table.addCol.useMutation();
    async function addCol() {
      if (newHeaderVal !== "") {
        // updatedRows.cells only contains the newley created cells for the last col
        const updatedRows = await mutateAsyncCol({ tableId: NewColModalProp.id, type: newHeaderType, header: newHeaderVal, viewName: NewColModalProp.view.name });

        // Update local state
        NewColModalProp.setLocalHeaders((prev) => [...prev, newHeaderVal]);
        NewColModalProp.setLocalHeaderTypes((prev) => [...prev, newHeaderType]);
        NewColModalProp.setData((prev) =>
          prev.map((row) => ({
            ...row,
            [newHeaderVal]: "",
          }))
        );
        NewColModalProp.setLocalShowing((prev) => {
          const newLocalShowing = [...prev];
          newLocalShowing.push(true);
          utils.table.getTableAndViewWithRowsAhead.setInfiniteData({baseId: NewColModalProp.baseId, tableName: NewColModalProp.tableName, viewName: NewColModalProp.view.name }, 
              (oldData) => {
                  //   pages: {
                  //     table: Table;
                  //     rows: Row[]; size is 200 as long as theres more
                  //     nextCursor: number | null;
                  //   }[],

                  // if value has never been cached before
                  if (!oldData) return oldData;
                  // set all table 
                  const newPages = oldData.pages.map((page) => {
                      return ({
                          ...page,
                          table: {
                              ...page.table,
                              showing: newLocalShowing
                          }
                          }
                      )
                  })
                  return {
                      ...oldData,
                      pages: newPages
                  }
              }   
          )
          return newLocalShowing
        })

        // Update the tRPC cache 
        utils.table.getTableAndViewWithRowsAhead.setInfiniteData(
          { baseId: NewColModalProp.baseId, tableName: NewColModalProp.tableName, viewName: NewColModalProp.view.name },
          (oldData) => {
            if (!oldData) return oldData;
            //   pages: {
            //     table: Table;
            //     rows: Row[]; size is 200 as long as theres more
            //     nextCursor: number | null;
            //   }[],
            const newPages = oldData.pages.map((page) => ({
              ...page,
              // overides the table from the spreaded ...page
              view: {
                ...page.view,
                showing: [...page.view.showing, true]
              },
              table: {
                ...page.table,
                headers: [...page.table.headers, newHeaderVal],
                headerTypes: [...page.table.headerTypes, newHeaderType],
              },
              rows: page.rows.map((row) => {
                // Find the new cell for this row
                const newCell = updatedRows.find((r) => r.id === row.id)?.cells[0];
                if (!newCell) return row;

                // Merge the new cell into the existing row.cells array
                return {
                  ...row,
                  cells: [...row.cells, {
                    id: newCell.id,
                    colNum: newCell.colNum,
                    val: newCell.val,
                    numVal: newCell.numVal ?? null,
                    rowId: newCell.rowId,
                  }],
                };
              }),
            }));

            return {
              ...oldData,
              pages: newPages,
            };
          }
        );
      }
      NewColModalProp.setModal(false);
    }


    return (
        <div style={{padding: "10px", border: "solid grey 1px", position: "fixed", width: "20vw", height: "150px", background: "white", display: "flex", flexDirection: "column", gap: "15px", zIndex: "1000", marginLeft: "70vw", marginTop: "260px"}}>
            <input placeholder="field name (optional)" style={{width: "100%", height: "35px", fontSize: "12px", borderRadius: "5px", padding: "5px", border: "solid grey 1px"}} type="text" value={newHeaderVal} onChange={(e) => setNewHeaderVal(e.target.value)}></input>
            <select style={{width: "100%", fontSize: "12px", border: "solid grey 1px", borderRadius: "5px", height: "35px"}} value={newHeaderType} onChange={(e) => setNewHeaderType(Number(e.target.value))}>
                <option value="0">Single line text</option>
                <option value="1">Number</option>
            </select>
            <div style={{display: "flex", justifyContent: "space-around"}}>
                <button style={{background: "#rgb(169, 169, 169)", fontWeight: "400", fontSize: "12px", width: "100px", height: "30px", borderRadius: "5px"}} onClick={() => (NewColModalProp.setModal(false))}>Cancel</button>
                <button style={{background: "#156FE2", fontWeight: "600", fontSize: "12px", color: "white", width: "100px", height: "30px", borderRadius: "5px"}} onClick={addCol}>Create field</button>
            </div>
        </div>
    )
}