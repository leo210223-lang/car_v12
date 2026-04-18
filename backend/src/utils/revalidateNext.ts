interface RevalidateRequest {
  path?: string | string[];
  tag?: string | string[];
}

function resolveFrontendUrl(): string {
  const candidates = [
    process.env['NEXT_APP_URL'],
    process.env['FRONTEND_URL'],
    process.env['VERCEL_URL'] ? `https://${process.env['VERCEL_URL']}` : undefined,
    'http://localhost:3000',
  ];

  const found = candidates.find((url) => typeof url === 'string' && url.trim().length > 0);
  return (found || 'http://localhost:3000').replace(/\/+$/, '');
}

export async function triggerNextRevalidation(payload: RevalidateRequest): Promise<void> {
  const token = process.env['REVALIDATION_TOKEN'];
  const frontendUrl = resolveFrontendUrl();

  if (!token) {
    console.error('[RevalidateBridge] Missing REVALIDATION_TOKEN, skip revalidation.');
    return;
  }

  try {
    const response = await fetch(`${frontendUrl}/api/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-revalidation-token': token,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const responseText = await response.text();
      console.error('[RevalidateBridge] Next.js revalidate failed:', response.status, responseText);
    }
  } catch (error) {
    // Health policy: do not break business API responses if cache sync fails.
    console.error('[RevalidateBridge] Failed to call Next.js revalidate endpoint:', error);
  }
}
