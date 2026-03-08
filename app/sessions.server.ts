import { createCookieSessionStorage, redirect } from "react-router";

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax",
    secrets: [process.env.AUTH_SECRET ?? "changeme-set-AUTH_SECRET"],
    secure: process.env.NODE_ENV === "production",
  },
});

export async function getSession(request: Request) {
  return sessionStorage.getSession(request.headers.get("Cookie"));
}

export async function getUserId(request: Request): Promise<string | null> {
  const session = await getSession(request);
  return session.get("userId") ?? null;
}

export async function requireUser(request: Request) {
  const session = await getSession(request);
  const userId = session.get("userId");
  if (!userId) throw redirect("/login");
  return {
    id: userId as string,
    name: (session.get("userName") ?? "") as string,
    email: (session.get("userEmail") ?? "") as string,
    image: (session.get("userImage") ?? null) as string | null,
  };
}
