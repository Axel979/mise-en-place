import { NextRequest, NextResponse } from 'next/server';
import { mockCalculateMacros } from '@/lib/mockClaude';

export async function POST(req: NextRequest) {
  const { recipeName, ingredients } = await req.json();
  const macros = mockCalculateMacros(recipeName, ingredients);
  return NextResponse.json({ macros });
}