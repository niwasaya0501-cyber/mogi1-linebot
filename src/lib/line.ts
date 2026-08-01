const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

async function callLineApi(path: string, body: unknown) {
  const res = await fetch(`https://api.line.me/v2/bot/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    console.error(`[line] ${path} failed:`, res.status, await res.text());
  }
}

export async function replyText(replyToken: string, text: string) {
  await callLineApi("message/reply", {
    replyToken,
    messages: [{ type: "text", text }],
  });
}

export async function pushText(userId: string, text: string) {
  await callLineApi("message/push", {
    to: userId,
    messages: [{ type: "text", text }],
  });
}

export async function getProfile(userId: string): Promise<{ displayName: string } | null> {
  try {
    const res = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
      headers: { Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}` },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { displayName?: string };
    return body.displayName ? { displayName: body.displayName } : null;
  } catch (error) {
    console.error("[line] getProfile failed:", error);
    return null;
  }
}
