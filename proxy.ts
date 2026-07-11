import { NextResponse, type NextRequest } from 'next/server'

// Pages that are public (landing, auth). Everything else requires a session cookie.
const PUBLIC_PATHS = ['/', '/login', '/register']

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const hasSession = Boolean(req.cookies.get('aaa_session')?.value)

  const isPublic = PUBLIC_PATHS.includes(pathname)

  // Authenticated users landing on login/register go straight to the app.
  if (hasSession && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  if (!hasSession && !isPublic) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  // Protect app pages; skip API routes, static assets, and files.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|icon.svg|og.png|screens|.*\\..*).*)'],
}
