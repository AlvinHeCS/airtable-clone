"use client"
import LogoutButton from "./logoutButton"
import "./profile.css";
import { useSession } from "next-auth/react";

export default function Profile() {
    const { data: session, status } = useSession();

    return (
        <div className="profileContainer">
            <div style={{display: "flex", alignItems: "center", flexDirection: "column", width: "100%"}}>
                <span style={{fontSize: "14px", textAlign: "start", width: "100%", fontWeight: "500"}}>{session?.user.name}</span>
                <span style={{fontSize: "14px", textAlign: "start", width: "100%"}}>{session?.user.email}</span>
            </div>
            <div style={{borderBottom: "solid grey 1px"}}></div>
            <div style={{display: "flex", alignItems: "center", flexDirection: "column", width: "100%"}}>
                <button style={{display: "flex", alignItems: "center", gap: "10px"}}><img src="/account.svg" style={{width: "15px", height: "15px"}}></img>Account</button>
                <button style={{display: "flex", alignItems: "center", gap: "10px"}}><img src="/group.svg" style={{width: "15px", height: "15px"}}></img>Manage groups</button>
                <button style={{display: "flex", alignItems: "center", gap: "10px"}}><img src="/bell.svg" style={{width: "15px", height: "15px"}}></img>Notification preferences</button>
                <button style={{display: "flex", alignItems: "center", gap: "10px"}}><img src="/language.svg" style={{width: "15px", height: "15px"}}></img>Language preferences</button>
                <button style={{display: "flex", alignItems: "center", gap: "10px"}}><img src="/art.svg" style={{width: "15px", height: "15px"}}></img>Appearance</button>
            </div>
            <div style={{borderBottom: "solid grey 1px"}}></div>
            <div style={{display: "flex", alignItems: "center", flexDirection: "column", width: "100%"}}>
            <button style={{display: "flex", alignItems: "center", gap: "10px"}}><img src="/mail.svg" style={{width: "15px", height: "15px"}}></img>Contact sales</button>
            <button style={{display: "flex", alignItems: "center", gap: "10px"}}><img src="/star.svg" style={{width: "15px", height: "15px"}}></img>Upgrade</button>
            <button style={{display: "flex", alignItems: "center", gap: "10px"}}><img src="/mail.svg" style={{width: "15px", height: "15px"}}></img>Tell a friend</button>
            </div>
            <div style={{borderBottom: "solid grey 1px"}}></div>
            <div style={{display: "flex", alignItems: "center", flexDirection: "column", width: "100%"}}>
            <button style={{display: "flex", alignItems: "center", gap: "10px"}}><img src="/chain.svg" style={{width: "15px", height: "15px"}}></img>Intergration</button>
            <button style={{display: "flex", alignItems: "center", gap: "10px"}}><img src="/tool.svg" style={{width: "15px", height: "15px"}}></img>Builder hub</button>
            </div>
            <div style={{borderBottom: "solid grey 1px"}}></div>
            <div style={{display: "flex", alignItems: "center", flexDirection: "column", width: "100%"}}>
            <button style={{display: "flex", alignItems: "center", gap: "10px"}}><img src="/trash.svg" style={{width: "15px", height: "15px"}}></img>Trash</button>
                <LogoutButton />     
            </div>
        </div>
    )
}