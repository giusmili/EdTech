import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { username, password } = await request.json();

  if (
    username === process.env.AUTH_USERNAME &&
    password === process.env.AUTH_PASSWORD
  ) {
    return NextResponse.json({ success: true, username });
  }

  return NextResponse.json(
    { success: false, error: 'Identifiants incorrects' },
    { status: 401 }
  );
}
