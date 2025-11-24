"use client"

import { useState } from "react"
import { api } from "~/trpc/react"

type TableRow = Record<string, string> & { rowId: string };

interface prop {
    tableId: {
        id: string;
        tableName: string;
        baseId: string;
        setModal: React.Dispatch<React.SetStateAction<boolean>>;
        setData: React.Dispatch<React.SetStateAction<TableRow[]>>;
        setLocalHeaders: React.Dispatch<React.SetStateAction<string[]>>;
        setLocalHeaderTypes: React.Dispatch<React.SetStateAction<number[]>>;
    }
}

export default function NewColModal(NewColModalProp: prop) {
    const [newHeaderVal, setNewHeaderVal] = useState<string>("");
    const [newHeaderType, setNewHeaderType] = useState<string>("0");
    const utils = api.useUtils();
    const tableId = NewColModalProp.tableId
    const { mutateAsync: mutateAsyncCol } = api.table.addCol.useMutation();
    function addCol() {
        if (newHeaderVal !== "" && newHeaderType !== "") {
            let type;
            if (newHeaderType === "0") {
                type = 0;
            } else {
                type = 1;
            }
            mutateAsyncCol({tableId: tableId.id, type: type, header: newHeaderVal});        
            tableId.setLocalHeaders((prev) => [...prev, newHeaderVal]);
            tableId.setLocalHeaderTypes((prev) => [...prev, type])
            // data is an array containg table rows
            tableId.setData((prev) => prev.map((row) => ({
                ...row,
                [newHeaderVal]: "",
            })))
        }
        tableId.setModal(false); 
    }

    return (
        <div style={{padding: "10px", border: "solid grey 1px", position: "fixed", width: "20vw", height: "150px", background: "white", display: "flex", flexDirection: "column", gap: "15px", zIndex: "1000", marginLeft: "70vw", marginTop: "260px"}}>
            <input placeholder="field name (optional)" style={{width: "100%", height: "35px", fontSize: "12px", borderRadius: "5px", padding: "5px", border: "solid grey 1px"}} type="text" value={newHeaderVal} onChange={(e) => setNewHeaderVal(e.target.value)}></input>
            <select style={{width: "100%", fontSize: "12px", border: "solid grey 1px", borderRadius: "5px", height: "35px"}} value={newHeaderType} onChange={(e) => setNewHeaderType(e.target.value)}>
                <option value="0">Single line text</option>
                <option value="1">Number</option>
            </select>
            <div style={{display: "flex", justifyContent: "space-around"}}>
                <button style={{background: "#rgb(169, 169, 169)", fontWeight: "400", fontSize: "12px", width: "100px", height: "30px", borderRadius: "5px"}} onClick={() => (tableId.setModal(false))}>Cancel</button>
                <button style={{background: "#156FE2", fontWeight: "600", fontSize: "12px", color: "white", width: "100px", height: "30px", borderRadius: "5px"}} onClick={addCol}>Create field</button>
            </div>
        </div>
    )
}