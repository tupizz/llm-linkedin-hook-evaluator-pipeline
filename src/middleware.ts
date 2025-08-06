import { NextRequest, NextResponse } from 'next/server';

// Configuration
const BASIC_AUTH_USERNAME = process.env.BASIC_AUTH_USERNAME || 'admin';
const BASIC_AUTH_PASSWORD = process.env.BASIC_AUTH_PASSWORD || 'linkedin-hooks-2024';

export function middleware(request: NextRequest) {
  // Skip authentication for static assets
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/favicon') ||
    request.nextUrl.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check for basic auth header
  const basicAuth = request.headers.get('authorization');
  const url = request.nextUrl.clone();

  if (!basicAuth) {
    return new NextResponse('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="LinkedIn Hook Evaluator"',
      },
    });
  }

  // Verify credentials
  const authValue = basicAuth.split(' ')[1];
  const [username, password] = Buffer.from(authValue, 'base64').toString().split(':');

  if (username !== BASIC_AUTH_USERNAME || password !== BASIC_AUTH_PASSWORD) {
    return new NextResponse('Invalid credentials', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="LinkedIn Hook Evaluator"',
      },
    });
  }

  return NextResponse.next();
}

// Configure which paths to protect
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};