"use client"

import LogoutButton from "../_components/logoutButton"
import { api } from "~/trpc/react"
import Base from "~/app/_components/base"


export default function UserIdPage() {
    const utils = api.useUtils();
    const { data, isLoading } = api.user.getBases.useQuery();
    const { mutateAsync } = api.user.addBase.useMutation({
        onSuccess: () => {
            utils.user.getBases.invalidate();
        }
    })

    if (isLoading) {
        return (
            <>
                <span>Loading bases...</span>
            </>
        )
    }

    return(
        <>
            <span>Hello you are logged in now</span>
            <LogoutButton/>
            <div>
                {data?.map((base) => {
                    return(
                        <div key={base.id}>
                        <Base base={base} />
                    </div>
                    )
                })}
            </div>
            <button onClick={() => mutateAsync()}>create bases</button>
        </>
    )
};