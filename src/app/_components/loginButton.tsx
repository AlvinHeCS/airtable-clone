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
        if (session.data?.user) {
            router.push(`/${session.data?.user.id}`)
        }
    }, [session])

    useEffect(() => {
        console.log("loading:", isLoading, "data:", data, "error:", error);
      }, [isLoading, data, error]);

    return (
        <>
            <button onClick={() => signIn("google", { prompt: "select_account" })}>
            login with Google
            </button>
        </>
    )    
}