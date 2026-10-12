export async function apiFetcher<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    let message = `Request gagal (${response.status})`;

    try {
      const payload = (await response.json()) as { message?: string };
      if (payload.message) message = payload.message;
    } catch {
      // Respons bukan JSON, gunakan status HTTP.
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}
