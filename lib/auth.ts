import { cookies } from "next/headers";

const accessName = "guest_feedback_access";
const refreshName = "guest_feedback_refresh";
export const authConfigured = () => Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);

export function authHeaders(token?: string) {
  return { apikey: process.env.SUPABASE_ANON_KEY || "", "Content-Type": "application/json", ...(token ? {Authorization: `Bearer ${token}`} : {}) };
}
export function authUrl(path: string) {
  return `${(process.env.SUPABASE_URL || "").replace(/\/$/, "")}/auth/v1/${path}`;
}
type AuthSession = {access_token: string; refresh_token: string; expires_in?: number};
export async function setSession(session: AuthSession) {
  const jar = await cookies();
  const opts = { httpOnly: true as const, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };
  jar.set(accessName, session.access_token, {...opts, maxAge: Math.max(60, session.expires_in || 3600)});
  jar.set(refreshName, session.refresh_token, {...opts, maxAge: 60 * 60 * 24 * 30});
}
export async function clearSession() {
  const jar = await cookies();
  jar.delete(accessName);
  jar.delete(refreshName);
}
export async function getAuthenticatedUser(): Promise<{ id: string; email?: string } | null> {
  if (!authConfigured()) return null;
  const jar = await cookies();
  let token = jar.get(accessName)?.value;
  let response: Response | undefined;
  if (token) {
    response = await fetch(authUrl("user"), {headers: authHeaders(token), cache: "no-store"});
    if (response.ok) {
      const data = await response.json() as {id?: string;email?:string};
      return data.id ? {id: data.id, email: data.email} : null;
    }
  }
  const refresh = jar.get(refreshName)?.value;
  if (!refresh) return null;
  const refreshed = await fetch(authUrl("token?grant_type=refresh_token"), {
    method: "POST", headers: authHeaders(), body: JSON.stringify({refresh_token: refresh}), cache: "no-store"
  });
  if (!refreshed.ok) return null;
  const session = await refreshed.json() as AuthSession;
  if (!session.access_token || !session.refresh_token) return null;
  await setSession(session);
  token = session.access_token;
  response = await fetch(authUrl("user"), {headers: authHeaders(token), cache: "no-store"});
  if (!response.ok) return null;
  const data = await response.json() as {id?:string;email?:string};
  return data.id ? {id: data.id, email: data.email} : null;
}
