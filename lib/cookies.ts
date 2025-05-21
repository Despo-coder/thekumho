'use client';

/**
 * Client-side cookie utilities
 * 
 * This uses plain JS for cookie handling
 * For components that need cookies, use this instead of the Next.js cookies API
 */

/**
 * Gets a cookie value by name
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

/**
 * Sets a cookie
 */
export function setCookie(
  name: string, 
  value: string, 
  options: { maxAge?: number; path?: string; secure?: boolean; } = {}
): void {
  if (typeof document === 'undefined') return;
  
  const { maxAge = 30 * 24 * 60 * 60, path = '/', secure = process.env.NODE_ENV === 'production' } = options;
  
  let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
  cookie += `; max-age=${maxAge}`;
  cookie += `; path=${path}`;
  if (secure) cookie += '; secure';
  
  document.cookie = cookie;
}

/**
 * Deletes a cookie
 */
export function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${encodeURIComponent(name)}=; max-age=0; path=/`;
} 