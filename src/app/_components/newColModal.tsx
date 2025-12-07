"use client"

import { useState } from "react"
import { api } from "~/trpc/react"
import type { View, HeaderType } from "~/types/types";
import "./newColModal.css";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "src/components/ui/select"

interface prop {
    tableId: string;
    setModal: React.Dispatch<React.SetStateAction<boolean>>;
    view: View;
    views: View[];
    position: {top: number, left: number}
}

export default function NewColModal(NewColModalProp: prop) {
    const [newHeaderVal, setNewHeaderVal] = useState<string>("");
    const [newHeaderType, setNewHeaderType] = useState<HeaderType>("string");
    const utils = api.useUtils();
    const { mutateAsync: mutateAsyncCol, isPending } = api.table.addCol.useMutation();
    async function addCol() {

      await mutateAsyncCol({ tableId: NewColModalProp.tableId, type: newHeaderType, header: newHeaderVal, viewName: NewColModalProp.view.name });
      
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
            const newRows = page.rows.map((row, _) => {
              const newCellsFlatVal = newHeaderType === "string" ? "" : null
              return {
                ...row,
                cellsFlat: [...row.cellsFlat, newCellsFlatVal]
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
        <div style={{padding: "5px", border: "solid rgba(220, 220, 220, 1) 1px", position: "fixed", width: "400px", background: "white", display: "flex", flexDirection: "column", gap: "15px", zIndex: "1000", left: `${NewColModalProp.position.left + 615}px`, top: `${NewColModalProp.position.top + 35}px`}}>
            <div style={{padding: "5px", display: "flex", flexDirection: "column", gap: "15px" }}>
              <input className="colTitle" placeholder="field name (optional)" style={{width: "100%", height: "35px", fontSize: "12px", borderRadius: "5px", paddingLeft: "10px"}} type="text" value={newHeaderVal} onChange={(e) => setNewHeaderVal(e.target.value)}></input>
            <Select value={newHeaderType} onValueChange={(val: HeaderType) => setNewHeaderType(val)}>
              <SelectTrigger className="w-[100%] text-xs h-[35px]">
                <SelectValue/>
              </SelectTrigger>
              <SelectContent className="z-[2000]">
                <SelectGroup>
                  <SelectItem value="string"><img src="/letter.svg" style={{width: "10px", height: "10px"}}></img>Single line text</SelectItem>
                  <SelectItem value="number"><img src="/hashtag.svg" style={{width: "10px", height: "10px"}}></img>Number</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
              <div style={{display: "flex", justifyContent: "space-between"}}>
                <button className="greyHover" style={{display: "flex", justifyContent: "center", alignItems: "center", gap: "5px", paddingLeft: "10px", paddingRight: "10px", paddingTop: "5px", paddingBottom: "5px", borderRadius: "5px"}}>
                  <img src="/plus2.svg" style={{width: "13px", height: "13px"}}></img>
                  <div style={{fontSize: "13px"}}>Add description</div>
                </button>
                <div style={{display: "flex", justifyContent: "center", alignItems: "center", gap: "10px"}}>
                    <button className="greyHover" style={{fontWeight: "400", fontSize: "12px", width: "80px", height: "30px", borderRadius: "5px"}} onClick={() => (NewColModalProp.setModal(false))}>Cancel</button>
                    <button className="create" disabled={isPending} style={{background: "#156FE2", fontWeight: "600", fontSize: "12px", color: "white", width: "100px", height: "30px", borderRadius: "5px"}} onClick={addCol}>{isPending ? "Creating...":"Create field"}</button>
                </div>
              </div>
            </div>
            <div style={{padding: "10px", width: "100%", height: "45px", background: "#F7F8FC", display: "flex", alignItems: "center", justifyContent: "space-between"}}>
              <div style={{display: "flex", alignItems: "center", fontSize: "13px", gap: "5px"}}>
                <img src="/purpleCube.png" style={{width: "15px", height: "15px"}}></img>
                Automate this field with an agent
                <img src="/information.svg" style={{width: "15px", height: "15px"}}></img>
              </div>
              <button style={{color: "rgba(55, 55, 55, 1)", width: "60px", height: "25px", fontSize: "11px", background: "white", display: "flex", justifyContent: "center", alignItems: "center", borderRadius: "5px", border: "solid rgba(209, 209, 209, 1) 0.5px"}}>
                Convert
              </button>
            </div>
        </div>
    )
  }