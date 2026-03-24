import { NextRequest, NextResponse } from 'next/server';
import { mockVerifyPhoto } from '@/lib/mockClaude';

export async function POST(req: NextRequest) {
  const { recipeName } = await req.json();
  const result = mockVerifyPhoto(recipeName);
  return NextResponse.json(result);
}