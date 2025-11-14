import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";



interface BaseProps {

    base: {
        id: string
        name: string
        tableAmount: number
        userId: string
    }
}

export default function Base({ base }: BaseProps) {
    const [color] = useState(() => `rgb(${Math.random()*80|0}, ${Math.random()*80|0}, ${Math.random()*80|0})`);
    const router = useRouter();
    const pathname = usePathname(); 
    return(     
      <button onClick={() => {router.push(`${pathname}/${base.id}`)}} style={{gap: "20px", width: "310px", height: "90px", border: "solid rgb(223, 223, 223) 1px", borderRadius: "10px", display: "flex", padding: "15px", alignItems: "center"}}>
          <div><div style={{width: "50px", height: "50px", background: color, borderRadius: "10px", color: "white", fontSize: "20px", display: "flex", alignItems: "center", justifyContent: "center"}}>Un</div></div>
          <div style={{display: "flex", flexDirection: "column", alignItems: "flex-start"}}>
            <span>{base.name}</span>
            <span>Opened just now</span>
          </div>
      </button>
    )
}
