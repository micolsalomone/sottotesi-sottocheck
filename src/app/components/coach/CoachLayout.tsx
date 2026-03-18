import { Outlet } from 'react-router';
import { CoachSidebar } from './CoachSidebar';
import { CoachHeader } from './CoachHeader';

export function CoachLayout() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      {/* Header */}
      <CoachHeader />

      {/* Body: sidebar + main */}
      <div className="flex flex-1">
        <CoachSidebar />
        <main className="flex-1 min-w-0 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
