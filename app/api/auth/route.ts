import { NextResponse } from "next/server";
import { authConfigured, authHeaders, authUrl, clearSession, getAuthenticatedUser, setSession } from "../../../lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const reply = (data: unknown, status = 200) => NextResponse.json(data, {status, headers: {"Cache-Control": "no-store"}});

export async function GET() {
  if (!authConfigured()) return reply({configured:false, user:null});
  try { return reply({configured:true, user: await getAuthenticatedUser()}); }
  catch { return reply({configured:true, user:null}); }
}
export async function POST(request: Request) {
  if (!authConfigured()) return reply({error:"Account registration is not configured yet."},503);
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) return reply({error:"Invalid origin."},403);
  const actionBody = await request.text();
  if (actionBody.length > 4096) return reply({error:"Request too long."},413);
  let body: Record<string, unknown>;
  try { body = JSON.parse(actionBody); } catch { return reply({error:"Invalid request."},400); }
  const action = body.action;
  if (action === "logout") { await clearSession(); return reply({ok:true}); }
  if (action !== "signup" && action !== "login") return reply({error:"Invalid action."},400);
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || password.length < 8 || password.length > 128)
    return reply({error:"Enter a valid email and a password of at least 8 characters."},400);
  try {
    const response = await fetch(authUrl(action === "signup" ? "signup" : "token?grant_type=password"), {
      method:"POST", headers:authHeaders(), body:JSON.stringify({email,password}), cache:"no-store"
    });
    const data = await response.json() as {access_token?:string;refresh_token?:string;expires_in?:number;error_description?:string;msg?:string;message?:string;user?:{id?:string}};
    if (!response.ok) return reply({error:data.msg || data.error_description || data.message || "Couldn't complete your request."},response.status === 429 ? 429 : 400);
    if (data.access_token && data.refresh_token) {
      await setSession({access_token:data.access_token,refresh_token:data.refresh_token,expires_in:data.expires_in});
      const user = await getAuthenticatedUser();
      return reply({ok:true,user});
    }
    return reply({ok:true,confirmationRequired:true,message:"Check your email to confirm your account, then sign in."});
  } catch { return reply({error:"Authentication service unavailable. Please try again."},503); }
}
