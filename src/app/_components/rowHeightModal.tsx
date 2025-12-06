"use client"

import type { View, CellHeight } from "~/types/types";
import { api } from "~/trpc/react"
import { Virtualizer } from "@tanstack/react-virtual";

interface prop {
    setModal: React.Dispatch<React.SetStateAction<boolean>>;
    view: View;
    tableId: string;
    position: {top: number, left: number};
    virtualizer: Virtualizer<HTMLDivElement, Element>
}

export default function RowHeightModal(RowHeightModalProp: prop) {
    const utils = api.useUtils();
    const { mutate: mutateCellHeight, mutateAsync: mutateAsyncCellHeight } = api.view.editCellHeight.useMutation()
    function buttonClicked(size: CellHeight) {
        RowHeightModalProp.setModal(false)
        // backend 
        if (size === "small") {
            mutateCellHeight({viewId: RowHeightModalProp.view.id, newCellHeight: "small"})
        } else if (size === "medium") {
            mutateCellHeight({viewId: RowHeightModalProp.view.id, newCellHeight: "medium"})
        } else {
            mutateCellHeight({viewId: RowHeightModalProp.view.id, newCellHeight: "large"})
        }

        // for some reason this isnt triggering a rerender of the table
        // update trpc

        utils.table.getViews.setData({tableId: RowHeightModalProp.tableId}, (prev) => {
            if (!prev) return prev
            return prev.map((view) => {
                if (view.id === RowHeightModalProp.view.id) {
                    console.log("this is new view: ", {...view, cellHeight: size})
                    return {
                        ...view,
                        cellHeight: size
                    }
                } else {
                    return view
                }
            })
        })
        // remeasure vitualizer
        requestAnimationFrame(() => {
        RowHeightModalProp.virtualizer.measure()
        })
    }   


    return (
        <div style={{zIndex: 1000,position: "fixed", top: RowHeightModalProp.position.top, left: RowHeightModalProp.position.left, width: "200px", height: "200px", background: "white", display: "flex", flexDirection: "column", gap: "10px", alignItems: "center"}}>
            <button onClick={() => buttonClicked("small")} style={{width: "150px", height: "40px"}}>small</button>
            <button onClick={() => buttonClicked("medium")} style={{width: "150px", height: "40px"}}>medium</button>
            <button onClick={() => buttonClicked("large")} style={{width: "150px", height: "40px"}}>large</button>
        </div>
    )
}