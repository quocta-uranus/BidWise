import { NextRequest, NextResponse } from 'next/server';

// Middleware chỉ pass through — auth guard thực sự nằm ở từng page/layout
// vì Access Token lưu in-memory (Zustand), Edge Runtime không đọc được
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
