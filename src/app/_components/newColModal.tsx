"use client"

import { useState } from "react"
import { api } from "~/trpc/react"

interface prop {
    tableId: {
        id: string
        setModal: React.Dispatch<React.SetStateAction<boolean>>;
    }
}

export default function NewColModal(NewColModalProp: prop) {
    const [newHeaderVal, setNewHeaderVal] = useState<string>("");
    const [newHeaderType, setNewHeaderType] = useState<string>("0");
    const utils = api.useUtils();
    const tableId = NewColModalProp.tableId
    const { mutateAsync: mutateAsyncCol } = api.table.addCol.useMutation({
        onSuccess: () => {
          utils.base.getTableFromName.invalidate();
      }
    });

    function addCol() {
        if (newHeaderVal !== "" && newHeaderType !== "") {
            let type;
            if (newHeaderType === "0") {
                type = 0;
            } else {
                type = 1;
            }
            mutateAsyncCol({tableId: tableId.id, type: type, header: newHeaderVal});        
        }
        tableId.setModal(false); 
    }

    return (
        <div style={{border: "solid black 1px"}}>
            <input type="text" value={newHeaderVal} onChange={(e) => setNewHeaderVal(e.target.value)}></input>
            <select value={newHeaderType} onChange={(e) => setNewHeaderType(e.target.value)}>
                <option value="0">Text</option>
                <option value="1">Number</option>
            </select>
            <button onClick={addCol}>submit</button>
        </div>
    )
}