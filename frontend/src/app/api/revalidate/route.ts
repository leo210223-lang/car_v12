import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

interface RevalidatePayload {
  secret?: string;
  path?: string | string[];
  tag?: string | string[];
}

function toArray(value?: string | string[]): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RevalidatePayload;
    const tokenFromHeader = req.headers.get('x-revalidation-token') || undefined;
    const secret = tokenFromHeader ?? body.secret;
    const expected = process.env.REVALIDATION_TOKEN;

    if (!expected || secret !== expected) {
      return NextResponse.json({ revalidated: false, message: 'Unauthorized' }, { status: 401 });
    }

    const paths = toArray(body.path).filter(Boolean);
    const tags = toArray(body.tag).filter(Boolean);

    if (paths.length === 0 && tags.length === 0) {
      return NextResponse.json(
        { revalidated: false, message: 'Missing path or tag' },
        { status: 400 }
      );
    }

    paths.forEach((path) => revalidatePath(path));
    tags.forEach((tag) => revalidateTag(tag, 'max'));

    return NextResponse.json({
      revalidated: true,
      now: Date.now(),
      paths,
      tags,
    });
  } catch (error) {
    console.error('[RevalidateRoute] Failed to process request:', error);
    return NextResponse.json(
      { revalidated: false, message: 'Invalid payload' },
      { status: 400 }
    );
  }
}
