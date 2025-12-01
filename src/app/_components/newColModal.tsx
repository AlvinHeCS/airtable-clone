"use client"

import type { Cell } from "generated/prisma";
import { useState } from "react"
import { api } from "~/trpc/react"
import type { View } from "~/types/types";

interface prop {
    tableId: string;
    setModal: React.Dispatch<React.SetStateAction<boolean>>;
    view: View;
    views: View[];
}

export default function NewColModal(NewColModalProp: prop) {
    const [newHeaderVal, setNewHeaderVal] = useState<string>("");
    const [newHeaderType, setNewHeaderType] = useState<number>(0);
    const utils = api.useUtils();
    const { mutateAsync: mutateAsyncCol } = api.table.addCol.useMutation();
    async function addCol() {
      const updatedRows = await mutateAsyncCol({ tableId: NewColModalProp.tableId, type: newHeaderType, header: newHeaderVal, viewName: NewColModalProp.view.name });
      
      // trpc update view
      utils.table.getViews.setData({tableId: NewColModalProp.tableId}, (prev) => {
        if (!prev) return prev
        return prev.map((view) => {
          if (view.id === NewColModalProp.view.id) {
            return {
              ...view,
              showing: [...view.showing, true]
            } 
          } else {
            return {
              ...view,
              showing: [...view.showing, false]
            }
          }
        })
      })

      // trpc update table
      utils.table.getTable.setData({ tableId: NewColModalProp.tableId },
        (prev) => {
          if (!prev) return prev
          return {
            ...prev,
            headers: [...prev.headers, newHeaderVal],
            headerTypes: [...prev.headerTypes, newHeaderType]
          }
        } 
      )

      // trpc update rows
      // need to update rowsAhead for all views
      //update rows only has cells for the last column need to combine it with the new one to get full value 
      for (let view of NewColModalProp.views) {
        utils.table.rowsAhead.setInfiniteData({ tableId: NewColModalProp.tableId, viewId: view.id}, (oldData) => {
          if (!oldData) return oldData
          const newPages = oldData.pages.map((page) => {
            const newRows = page.rows.map((row, i) => {
              const newCell: Cell= {
                id: `cell_${i}_${crypto.randomUUID()}`,
                colNum: row.cells.length,
                val: "",
                numVal: null,
                rowId: row.id
              }
              return {
                ...row,
                cells: [...row.cells, updatedRows[i]?.cells[0] as Cell]
              }
            })
            return {
              ...page,
              rows: newRows,
            }
          })
          return {
            ...oldData,
            pages: newPages
          }
        })
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