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
                <button onClick={() => signOut({ callbackUrl: "/" })}>
                    Sign Out
                </button>
            )}
        </>
    )    
}