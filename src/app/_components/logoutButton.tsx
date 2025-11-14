"use client"

import { signOut, useSession } from "next-auth/react"
import { useRouter } from "next/navigation";
import { useEffect } from "react"

export default function LogoutButton() {
    const router = useRouter();
    const session = useSession();

    useEffect(() => {
        if (!session.data?.user) {
            router.push("/")
        }
    }, [session])

    return (
        <>
            {session.data?.user && (
                <button style={{display: "flex", alignItems: "center", gap: "10px"}}onClick={() => signOut({ callbackUrl: "/" })}>
                    <img src="/exit.svg" style={{width: "15px", height: "15px"}}></img>
                    Log Out
                </button>
            )}
        </>
    )    


}