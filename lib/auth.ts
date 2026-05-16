import { cookies } from "next/headers"

export const AUTH_COOKIE = "bw_admin_auth"
const AUTH_VALUE = "authenticated"

export function getAdminUsername(): string {
  return process.env.ADMIN_USERNAME || "admin"
}

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || "admin123"
}

export function verifyCredentials(username: string, password: string): boolean {
  return username === getAdminUsername() && password === getAdminPassword()
}

export function isAuthenticated(): boolean {
  try {
    const c = cookies().get(AUTH_COOKIE)
    return c?.value === AUTH_VALUE
  } catch {
    return false
  }
}

export function getAuthCookieOptions() {
  return {
    name: AUTH_COOKIE,
    value: AUTH_VALUE,
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24,
    secure: process.env.NODE_ENV === "production",
  }
}
