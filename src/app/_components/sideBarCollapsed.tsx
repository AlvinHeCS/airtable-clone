

export default function SideBarCollapsed() {
    return (
        <div style={{ display: "flex", width: "50px", position: "sticky", height: "92vh", padding: "10px", boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)", justifyContent: "space-between", flexDirection: "column"}}>
            <div style={{display: "flex", flexDirection: "column", width: "100%", gap: "2.5px"}}>
                <button style={{fontWeight: "500", fontSize: "16px", height: "40px", display: "flex", alignItems: "center", gap: "10px", justifyContent: "center"}}>
                    <div style={{display: "flex", alignItems: "center", gap: "10px"}}><img src="/house.svg" style={{width: "15px", height: "15px"}}></img></div>
                </button>                
                <button style={{fontWeight: "500", fontSize: "16px", height: "40px", display: "flex", alignItems: "center", gap: "10px", justifyContent: "center"}}>
                    <div style={{display: "flex", alignItems: "center", gap: "10px"}}><img src="/starE.svg" style={{width: "15px", height: "15px"}}></img></div>
                </button>
                <button style={{fontWeight: "500", fontSize: "16px", height: "40px", display: "flex", alignItems: "center", gap: "10px", justifyContent: "center"}}>
                    <div style={{display: "flex", alignItems: "center", gap: "10px"}}><img src="/shared.svg" style={{width: "15px", height: "15px"}}></img></div>
                </button>
                <button style={{fontWeight: "500", fontSize: "16px", height: "40px", display: "flex", alignItems: "center", gap: "10px", justifyContent: "center"}}>
                    <div style={{display: "flex", alignItems: "center", gap: "10px"}}><img src="/workSpaces.svg" style={{width: "15px", height: "15px"}}></img></div>
                </button>
                <div style={{borderBottom: "solid grey 1px", marginTop: "5px"}}></div>            
            </div>
            <div style={{display: "flex", flexDirection: "column", width: "100%"}}>
                <div style={{borderBottom: "solid grey 1px", marginBottom: "20px"}}></div>
                <button style={{display: "flex", alignItems: "center", gap: "10px", justifyContent: "center"}}><img src="/book.svg" style={{width: "15px", height: "15px"}}></img></button>
                <button style={{display: "flex", alignItems: "center", gap: "10px", justifyContent: "center"}}><img src="/bag.svg" style={{width: "15px", height: "15px"}}></img></button>
                <button style={{display: "flex", alignItems: "center", gap: "10px", justifyContent: "center"}}><img src="/import.svg" style={{width: "15px", height: "15px"}}></img></button>
                <button style={{borderRadius: "5px", marginTop: "20px", marginBottom: "5px", height: "32px", border: "solid rgb(234, 234, 234) 0.5px"}}>C</button>
            </div>
        </div>
    )
}