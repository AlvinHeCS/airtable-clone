"use client"

import { useParams, useRouter } from "next/navigation";
import { api } from "~/trpc/react"
import { useSession } from "next-auth/react";
import Table from "~/app/_components/table"
import BaseSideBar from "~/app/_components/baseSideBar";
import BaseHeader from "~/app/_components/baseHeader";
import TableButton from "~/app/_components/tableButton";
import { useState } from "react";


export default function BasePage() {
    const [selectedTableName, setSelectedTableName] = useState<string>("Table 1");
    const utils = api.useUtils();
    const params = useParams();
    const baseId = params.baseId;
    const {data: tableAmount, isLoading: loadingTableAmount} = api.base.getTableAmount.useQuery({ baseId: String(baseId) });
    const { mutateAsync } = api.base.addTables.useMutation({
        onSuccess: () => {
            utils.base.getTableAmount.invalidate();
        }
    });

    function addTable() {
        mutateAsync({ baseId: String(baseId) })
    }

    if (loadingTableAmount) {
        return (
            <>
                loading table amount
            </>
        )
    }

    return (
        <div style={{display: "flex", width: "100%", height: "100vh", border: "solid red 1px"}}>
            <BaseSideBar />
            <div style={{display: "flex", flexDirection: "column", width: "100%"}}>
                <BaseHeader />
                <div style={{padding: "10px", display: "flex", gap: "20px"}}>
                    {Array.from({ length: tableAmount ?? 0 }).map((_, index) => {
                        return(                    
                        <div key={index}>
                            <button onClick={() => setSelectedTableName(`Table ${index + 1}`)}>Table {index + 1}</button>
                        </div>)
                    })} 

                    <button style={{width: "200px", textAlign: "left"}}onClick={addTable}>add new table</button>
                </div>
                <div>
                    {<Table key={selectedTableName} name={selectedTableName} baseId={String(baseId)}/>}
                </div>
            </div>
        </div>
    )
}