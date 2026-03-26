import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { answerHelpQuestion } from "@/lib/help-assistant";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const locale = typeof body?.locale === "string" ? body.locale : "en";
    const query = typeof body?.query === "string" ? body.query : "";

    const reply = await answerHelpQuestion(locale, query);

    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ error: "Unable to answer help question." }, { status: 500 });
  }
}
