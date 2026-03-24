import { NextRequest, NextResponse } from 'next/server';
import { mockGenerateRecipe } from '@/lib/mockClaude';

export async function POST(req: NextRequest) {
  const { prompt, profile } = await req.json();
  const recipe: any = mockGenerateRecipe(prompt, profile);
  recipe.id = Date.now();
  recipe.done = false;
  recipe.aiGenerated = true;
  return NextResponse.json({ recipe });
}