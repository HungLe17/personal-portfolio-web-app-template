export const DEMO_AUTH_COOKIE = "portfolio-demo-admin";

export function isDemoLoginEnabled() {
  return process.env.NODE_ENV !== "production" || process.env.ENABLE_DEMO_LOGIN === "true";
}

export function isDemoCredentials(username: string, password: string) {
  return isDemoLoginEnabled() && username === "dev" && password === "dev";
}
