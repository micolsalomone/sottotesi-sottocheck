export function getViewBasePath(pathname: string) {
  if (pathname.startsWith('/student-view')) {
    return '/student-view';
  }
  return '/coach-view';
}
