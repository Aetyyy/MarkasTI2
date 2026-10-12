export async function GET() {
  return Response.json({ ok: true, publicKey: process.env.VAPID_PUBLIC_KEY || "" });
}
