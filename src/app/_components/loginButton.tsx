"use client"

import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation";
import { useEffect } from "react"
import { api } from "~/trpc/react";

export default function LoginButton() {
    const router = useRouter();
    const session = useSession();
    const { data, isLoading } = api.user.getUsers.useQuery();
    useEffect(() => {
        console.log("this is users data", data);
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