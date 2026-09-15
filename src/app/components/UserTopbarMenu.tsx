import { ChevronDown, LogOut, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';

interface UserTopbarMenuProps {
  displayName: string;
  /**
   * Destination for the "Informazioni Account" item — the role's Account page
   * (`/public-view/account`, `/student-view/account`, `/impostazioni/account`).
   * Coach has no Account page yet and passes its Profile route as a documented
   * interim (see `CoachHeader`).
   */
  accountPath: string;
  /** Fallback navigation target on logout when `onLogout` is not provided. */
  logoutPath?: string;
  /**
   * Custom logout handler. When provided it fully owns logout (e.g. clearing a
   * prototype account session and routing), and `logoutPath` is ignored.
   */
  onLogout?: () => void;
}

export function UserTopbarMenu({
  displayName,
  accountPath,
  logoutPath,
  onLogout,
}: UserTopbarMenuProps) {
  const navigate = useNavigate();

  function handleGoToAccount() {
    navigate(accountPath);
  }

  function handleLogout() {
    if (onLogout) {
      onLogout();
      return;
    }
    if (logoutPath) navigate(logoutPath);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="admin-badge" aria-label="Apri menu utente" type="button">
          {displayName}
          <ChevronDown size={14} />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onSelect={handleGoToAccount}>
          <UserRound size={16} />
          Informazioni Account
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onSelect={handleLogout}>
          <LogOut size={16} />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
