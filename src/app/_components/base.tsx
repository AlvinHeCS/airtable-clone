import { useRouter, usePathname } from "next/navigation";



interface BaseProps {

    base: {
        id: string
        name: string
        tableAmount: number
        userId: string
    }
}

export default function Base({ base }: BaseProps) {
    const router = useRouter();
    const pathname = usePathname(); 
    return(
        <div style={{border: "solid black 1px"}}>
            <span>{base.name}, id: {base.id}</span>
            <button
  onClick={() => {
    router.push(`${pathname}/${base.id}`);
  }}
>
  go to base
</button>
        </div>
    )
}