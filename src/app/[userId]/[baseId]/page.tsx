"use client"

import { useParams, useRouter } from "next/navigation";
import { api } from "~/trpc/react"
import { useSession } from "next-auth/react";
import Table from "~/app/_components/table"

export default function BasePage() {
    const router = useRouter();
    const { data: session } = useSession();
    const utils = api.useUtils();
    const params = useParams();
    const baseId = params.baseId;
    const userId = session?.user.id;
    const {data, isLoading} = api.user.getBaseTables.useQuery({ baseId: String(baseId) });
    const { mutateAsync } = api.user.addTables.useMutation({
        onSuccess: () => {
            utils.user.getBaseTables.invalidate();
        }
    });
    function addTable() {
        mutateAsync({ baseId: String(baseId) })
    }

    function goBack() {
        router.push(`/${userId}`)
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
                    <div key={table.id}>
                        <Table tableData={table}/>
                    </div> 
                );
                }
            )}
            </span>
            <button onClick={addTable}>add new table</button>
            <button onClick={goBack}>return to homePage</button>
        </>
    )
}