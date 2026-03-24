import { NextRequest, NextResponse } from 'next/server';
import { mockPantrySuggestions } from '@/lib/mockClaude';

export async function POST(req: NextRequest) {
  const { ingredients } = await req.json();
  const suggestions = mockPantrySuggestions(ingredients);
  return NextResponse.json({ suggestions });
}