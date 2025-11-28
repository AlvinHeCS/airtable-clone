
import { api } from "~/trpc/react"
import { useState, useEffect } from "react"
import type { View } from "~/types/types";
import "./gridBar.css";

interface prop {
    tableId: string;
    baseId: string;
    tableName: string;
    setViewName: React.Dispatch<React.SetStateAction<string>>
    viewName: string;
}


export default function GridBar(GridBarProp: prop) {
    const utils = api.useUtils();
    const [localViews, setLocalViews] = useState<View[]>([]);
    const {data: views, isLoading: loadingViews} = api.table.getViews.useQuery({tableId: GridBarProp.tableId});
    const { mutateAsync: asynAddView } = api.table.addView.useMutation()
    useEffect(() => {
        if (!views) return;
        setLocalViews(views);
    }, [views]) 
    async function addView() {
        const newView = await asynAddView({tableId: GridBarProp.tableId});
        // update local
        setLocalViews((prev) => {
            return [...prev, newView]
        });

        // and then update trpc for the different views
        utils.table.getViews.setData({tableId: GridBarProp.tableId}, (prev) => {
            if (!prev) return []
            return(
                [...prev, newView]
            )
        })
    }

    if (loadingViews || !views) {
        return (
        <div style={{height: "100%", width: "300px", position: "sticky", top: "0", background: "rgb(207, 207, 207)"}}>
            <span>Loading views</span>
        </div>
        )
    }

    return (
        <div style={{borderTop: "grey solid 0.5px", borderRight: "grey solid 0.5px", height: "100%", width: "300px", padding: "10px", position: "sticky", top: "0", background: "rgba(255, 255, 255, 1)", display: "flex", flexDirection: "column"}}>
            <button className="addGrid" onClick={addView}>
                <img style={{ height: "16px", width: "16px" }} src="/plus2.svg" />
                <div style={{fontSize: "13px"}}>Create new...</div>
            </button>
            <div className="searchGrids">
                <img style={{ height: "16px", width: "16px" }} src="/search2.svg" />
                <div style={{fontSize: "13px", color: "grey"}}>Find a view</div>
            </div>
            
            {localViews.map((view) => {
                const isSelected = view.name === GridBarProp.viewName;
                return(
                    <button onClick={() => GridBarProp.setViewName(view.name)} key={view.id} className={`grid ${isSelected ? "selected" : "unselected"}`}>
                        <img style={{ width: "18px", height: "15px" }} src="/bTable.png" />
                        <div style={{fontSize: "13px", fontWeight: "400"}}>{view.name}</div>
                    </button>
                )
            })}
        </div>
    )
}