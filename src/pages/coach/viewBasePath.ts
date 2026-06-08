export function getViewBasePath(pathname: string) {
  if (pathname.startsWith('/public-view')) {
    return '/public-view';
  }
  if (pathname.startsWith('/student-view')) {
    return '/student-view';
  }
  return '/coach-view';
}
