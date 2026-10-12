import {
  getTeamPresenceAction,
  updateMyPresenceAction,
  type PresenceStatus,
} from "@/app/presence/actions";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getTeamPresenceAction();
  return Response.json({ ok: true, data });
}

export async function POST(request: Request) {
  let status: PresenceStatus = "ONLINE";

  try {
    const body = (await request.json()) as { status?: PresenceStatus };
    if (body.status === "OFFLINE") status = "OFFLINE";
  } catch {
    // Body kosong tetap berarti ONLINE.
  }

  const result = await updateMyPresenceAction(status);
  return Response.json(result, { status: result.ok ? 200 : 401 });
}
