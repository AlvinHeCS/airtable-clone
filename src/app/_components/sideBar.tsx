interface prop {
    createBase: () => void;
}

export default function SideBar({createBase} : prop) {
    return (
        <div style={{ display: "flex", width: "400px", top: 0, zIndex: "100", position: "sticky", height: "92vh", padding: "10px", boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)", justifyContent: "space-between", flexDirection: "column"}}>
            <div style={{display: "flex", flexDirection: "column", width: "100%", gap: "2.5px"}}>
                <button style={{fontWeight: "500", fontSize: "16px", height: "40px", display: "flex", alignItems: "center", gap: "10px", justifyContent: "space-between", padding: "10px", background: "rgb(242, 242, 242)"}}>
                    <div style={{display: "flex", alignItems: "center", gap: "10px"}}><img src="/house.svg" style={{width: "15px", height: "15px"}}></img>Home</div>
                </button>                
                <button style={{fontWeight: "500", fontSize: "16px", height: "40px", display: "flex", alignItems: "center", gap: "10px", justifyContent: "space-between", padding: "10px"}}>
                    <div style={{display: "flex", alignItems: "center", gap: "10px"}}><img src="/starE.svg" style={{width: "15px", height: "15px"}}></img>Starred</div>
                    <img src="/arrow.svg" style={{width: "15px", height: "15px"}}></img>
                </button>
                <button style={{fontWeight: "500", fontSize: "16px", height: "40px", display: "flex", alignItems: "center", gap: "10px", justifyContent: "space-between", padding: "10px"}}>
                    <div style={{display: "flex", alignItems: "center", gap: "10px"}}><img src="/shared.svg" style={{width: "15px", height: "15px"}}></img>Shared</div>
                </button>                   
                <button style={{fontWeight: "500", fontSize: "16px", height: "40px", display: "flex", alignItems: "center", gap: "10px", justifyContent: "space-between", padding: "10px"}}>
                    <div style={{display: "flex", alignItems: "center", gap: "10px"}}><img src="/workSpaces.svg" style={{width: "15px", height: "15px"}}></img>Workspaces</div>
                    <img src="/arrow.svg" style={{width: "15px", height: "15px"}}></img>
                </button>            
            </div>
            <div style={{display: "flex", flexDirection: "column", width: "100%"}}>
                <div style={{borderBottom: "solid grey 1px", marginBottom: "20px"}}></div>
                <button style={{display: "flex", alignItems: "center", gap: "10px"}}><img src="/book.svg" style={{width: "15px", height: "15px"}}></img>Templates and apps</button>
                <button style={{display: "flex", alignItems: "center", gap: "10px"}}><img src="/bag.svg" style={{width: "15px", height: "15px"}}></img>Marketplace</button>
                <button style={{display: "flex", alignItems: "center", gap: "10px"}}><img src="/import.svg" style={{width: "15px", height: "15px"}}></img>Import</button>
                <button onClick={() => void createBase()}style={{background: "rgb(50, 107, 231)", color: "white", borderRadius: "5px", marginTop: "20px", marginBottom: "10px", height: "32px"}}>Create</button>
            </div>
        </div>
    )
}