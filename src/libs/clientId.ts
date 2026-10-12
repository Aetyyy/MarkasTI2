type ClientCrypto = Partial<Pick<Crypto, "randomUUID" | "getRandomValues">>;

/** Create a unique browser ID even when randomUUID is unavailable in HTTP contexts. */
export function createClientId(
  cryptoApi: ClientCrypto | undefined =
    typeof globalThis.crypto === "undefined" ? undefined : globalThis.crypto,
) {
  if (typeof cryptoApi?.randomUUID === "function") return cryptoApi.randomUUID();
  if (typeof cryptoApi?.getRandomValues === "function") {
    const bytes = cryptoApi.getRandomValues(new Uint8Array(16));
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}
