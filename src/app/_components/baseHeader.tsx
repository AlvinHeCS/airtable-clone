"use client"

export default function BaseHeader() {
    return (
        <div style={{width: "100%", height: "7vh", position: "sticky", top: "0", display: "flex", justifyContent: "space-between", alignItems: "center", border: "solid grey 1px", padding: "10px"}}>
            <div style={{display: "flex", gap: "10px", alignItems: "center"}}>
                <div style={{background: "purple", width: "35px", height: "35px", display: "flex", justifyContent: "center", alignItems: "center", borderRadius: "5px"}}><img style={{width: "20px", height: "20px"}} src="/airtable.svg"></img></div>
                <span style={{fontSize: "16px"}}><b>Untitled Base</b></span>
                <img style={{width: "10px", height: "10px"}} src="/arrowD.svg"></img>
            </div>
            <div style={{display: "flex", alignItems: "center", gap: "15px"}}>
                <span style={{fontSize: "14px", fontWeight: "500"}}>Data</span>
                <span style={{fontSize: "14px", fontWeight: "500"}}>Automations</span>
                <span style={{fontSize: "14px", fontWeight: "500"}}>Interfaces</span>
                <span style={{fontSize: "14px", fontWeight: "500"}}>Forms</span>
            </div>
            <div style={{display: "flex", alignItems: "center", gap: "15px"}}>
                <img style={{width: "15px", height: "15px"}} src="/import.svg"></img>
                <button style={{borderRadius: "5px", padding: "5px", fontSize: "14px", width: "100px", height: "30px", border: "solid grey 1px"}}>Launch</button>
                <button style={{background: "purple", borderRadius: "5px", padding: "5px", color: "white", fontSize: "14px", width: "60px", height: "30px", fontWeight: "500"}}>Share</button>
            </div>
        </div>
    )
}