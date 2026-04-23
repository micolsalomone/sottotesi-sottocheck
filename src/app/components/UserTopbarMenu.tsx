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
  profilePath: string;
  logoutPath: string;
}

export function UserTopbarMenu({
  displayName,
  profilePath,
  logoutPath,
}: UserTopbarMenuProps) {
  const navigate = useNavigate();

  function handleGoToProfile() {
    navigate(profilePath);
  }

  function handleLogout() {
    navigate(logoutPath);
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
        <DropdownMenuItem onSelect={handleGoToProfile}>
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
