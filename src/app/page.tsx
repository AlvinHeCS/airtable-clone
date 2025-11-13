import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import LoginButton from "~/app/_components/loginButton";
import "./page.css";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    void api.post.getLatest.prefetch();
  }

  return (
    <HydrateClient>
        <div style={{width: "100%", height: "100%", display: "flex", gap: "10vw", justifyContent: "center", alignItems: "center"}}>
          <div style={{width: "30w", height: "90vh", display: "flex", flexDirection: "column", gap: "30px", marginRight: "78px", justifyContent: "center"}}>
            <img src="/airtable.svg" style={{width: "35px", height: "35px"}}></img>
            <span style={{fontSize: "32px", fontWeight: "500"}}>Sign in to Airtable</span>
            <div style={{display: "flex", flexDirection: "column", gap: "10px"}}>
              <span>Email</span>
              <input className= "input" style={{padding: "10px"}} type="text" placeholder="Email Address"></input>
            </div>
            <button className="input" style={{background: "#92AFE4", color: "white"}}>Continue</button>
            <span style={{display: "flex", justifyContent: "center"}}>or</span>
            <div style={{display: "flex", flexDirection: "column", gap: "17px"}}>
              <button className="input">Sign in with <b>Single Sign On</b></button>
              <LoginButton/>
              <button className="input">
                <div style={{display: "flex", flexDirection: "row", justifyContent: "center", width: "100%", height: "100%", alignItems: "center", gap: "10px"}}>
                <img style={{width: "18px", height: "18px"}} src="/apple.svg"></img>
                <span>Sign in with <b>Apple Id</b></span>
                </div>
              </button>
            </div>
            <span style={{fontSize: "13.5px", color: "grey"}}>New to Airtable? <a style={{color: "blue", textDecoration: "underline", cursor: "pointer"}}>Create an account</a> instead</span>
          </div>
          <div style={{width: "30vw", height: "70vh", display: "flex", justifyContent: "center"}}>
            <img src="/homePageDeco.png" style={{borderRadius: "20px"}}></img>
          </div>
        </div>
    </HydrateClient>
  );
}
