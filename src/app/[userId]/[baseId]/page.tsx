"use client"

import { useParams } from "next/navigation";
import { api } from "~/trpc/react"

export default function BasePage() {
    const utils = api.useUtils();
    const params = useParams();
    const baseId = params.baseId;
    const {data, isLoading} = api.user.getBaseTables.useQuery({ baseId: String(baseId) });
    const { mutateAsync } = api.user.addTables.useMutation({
        onSuccess: () => {
            utils.user.getBaseTables.invalidate();
        }
    });
    function addTable() {
        mutateAsync({ baseId: String(baseId) })
    }
    if (isLoading) {
        return (
            <>
                loading tables...
            </>
        )
    }

    return (
        <>
            <span>This is base page</span>
            <span>This is base id {baseId}</span>
            <span>This is data</span>
            <span>{data?.map((table) => {
                return(
                    <>
                        <div key={table.id}>
                            newtable: 
                            {table.id},
                            {table.name}
                        </div>
                    </>
                );
                }
            )}
            </span>
            <button onClick={addTable}>add new table</button>
        </>
    )
}