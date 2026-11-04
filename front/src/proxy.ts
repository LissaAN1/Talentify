import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';


const publicRoutes = ['/login', '/register', '/forgot-password'];

const protectedRoutes = ['/dashboard', '/marketplace', '/profile', '/orders', '/services', '/users'];

const apiRoutes = ['/api'];

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (apiRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.next();
    }

    const token = request.cookies.get('token')?.value;
    const isAuthenticated = !!token;

    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
    const isPublicRoute = publicRoutes.some(route => pathname === route);

    if (isProtectedRoute && !isAuthenticated) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    if (isPublicRoute && isAuthenticated && pathname === '/login') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|public|api/docs).*)',
    ],
};
