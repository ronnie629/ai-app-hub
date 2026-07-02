import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ purchased: false });
    }

    const { id: appId } = await params;

    // Free apps are considered "purchased" (accessible)
    const app = await prisma.app.findUnique({ where: { id: appId } });
    if (app?.price === 0) {
      return NextResponse.json({ purchased: true });
    }

    const purchase = await prisma.purchase.findFirst({
      where: { userId: session.id, appId },
    });

    // Developer can access their own app
    if (app?.developerId === session.id) {
      return NextResponse.json({ purchased: true });
    }

    return NextResponse.json({ purchased: !!purchase });
  } catch {
    return NextResponse.json({ purchased: false });
  }
}
