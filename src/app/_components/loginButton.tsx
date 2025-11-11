"use client"

import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation";
import { useEffect } from "react"
import { api } from "~/trpc/react";

export default function LoginButton() {
    const router = useRouter();
    const session = useSession();
    const { data, isLoading, error } = api.user.pingDB.useQuery();
    useEffect(() => {
        if (error) {
            console.error("TRPC query error:", error);
        }
        console.log("this is users data number", data);
        console.log("status:", session.status);
        console.log("data:", session.data);
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