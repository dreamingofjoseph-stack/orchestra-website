export function getAdminKey(): string {
  return localStorage.getItem("adminKey") ?? "";
}

export async function adminFetch(url: string, options: RequestInit = {}): Promise<Response> {
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Key": getAdminKey(),
      ...(options.headers ?? {}),
    },
  });
}
