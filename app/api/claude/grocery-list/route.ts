import { NextRequest, NextResponse } from 'next/server';
import { mockGroceryList } from '@/lib/mockClaude';

export async function POST(req: NextRequest) {
  const { ingredients } = await req.json();
  const list = mockGroceryList(ingredients);
  return NextResponse.json({ list });
}