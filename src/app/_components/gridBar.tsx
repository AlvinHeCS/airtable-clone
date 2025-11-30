
import { api } from "~/trpc/react"
import type { View } from "~/types/types";
import "./gridBar.css";

interface prop {
    tableId: string;
    views: View[];
    setSelectedView: React.Dispatch<React.SetStateAction<View | null>>
    view: View;
}

export default function GridBar(GridBarProp: prop) {
    const utils = api.useUtils();
    const { mutateAsync: asynAddView } = api.view.addView.useMutation()
    async function addView() {
        const newView = await asynAddView({tableId: GridBarProp.tableId});
        // and then update trpc for the different views
        utils.table.getViews.setData({tableId: GridBarProp.tableId}, (prev) => {
            if (!prev) return []
            return(
                [...prev, newView]
            )
        })
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
            
            {GridBarProp.views.map((view) => {
                const isSelected = view.id === GridBarProp.view.id;
                return(
                    <button onClick={() => GridBarProp.setSelectedView(view)} key={view.id} className={`grid ${isSelected ? "selected" : "unselected"}`}>
                        <img style={{ width: "18px", height: "15px" }} src="/bTable.png" />
                        <div style={{fontSize: "13px", fontWeight: "400"}}>{view.name}</div>
                    </button>
                )
            })}
        </div>
    )
}