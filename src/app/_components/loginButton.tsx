"use client"

import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation";
import { useEffect } from "react"


export default function LoginButton() {
    const router = useRouter();
    const session = useSession();

    useEffect(() => {
        if (session.data?.user) {
            router.push(`/${session.data?.user.id}`)
        }
    }, [session])

    return (
        <>
            <button onClick={() => signIn("google", { prompt: "select_account" })}>
            login with Google
            </button>
        </>
    )    
}