import { createContext, useContext, useState, type ReactNode } from 'react';

/**
 * Coach-view-ONLY prototype identity/profile state.
 *
 * This is deliberately NOT a Coach CRM: it does not read from or write to
 * Admin's `/coach` page (`CoachPage.tsx`, which owns its own local mock
 * `Coach[]` state), and Admin never reads this. It exists only so the Coach
 * self-service shell (header, `/coach-view/profilo`, `/coach-view/account`)
 * can demonstrate a coherent editable identity within one SPA session,
 * without inventing a shared backend/CRM architecture this prototype does
 * not own. Holds only the minimum presentation state those three surfaces
 * need — nothing else should be added here.
 *
 * Scoped to `CoachLayout` only (not mounted in `App.tsx`) — Admin's tree
 * never sees or depends on this provider. No `localStorage`: state resets
 * on a full browser refresh, same convention as every other prototype
 * context in this repo.
 *
 * `areas` is representative, read-only, presentation-only fixture data —
 * it demonstrates that a Coach can have multiple assigned thematic areas.
 * It is NOT read from `AreeTematicheContext` and NOT kept in sync with
 * Admin's real area-assignment relationship (`getAreasForCoach`); no
 * runtime Admin↔Coach synchronization exists in this prototype. Coach
 * self-service exposes no editing control for it — assignment stays
 * entirely Admin-owned. Production must source these values from the real
 * Coach/area-assignment domain (see `docs/production-handoff.md`).
 *
 * The seed values (name/email/phone/areas) intentionally correspond to the
 * Admin mock Coach `C-07` (Martina Rossi) for visual/identity consistency
 * across the two independent prototype surfaces — this is a coincidence of
 * fixture data, not a live binding. Production must resolve the Coach
 * shell's identity from the authenticated Coach record via the real
 * backend, and this prototype does not prescribe how (or whether) that
 * record is kept in sync with Admin's view of it.
 */

export interface CoachViewProfile {
  fullName: string;
  email: string;
  /**
   * PRIMARY operational contact number only. Product rule: Admin may manage
   * multiple Coach phone numbers, but self-service (`/coach-view/account`)
   * exposes and edits only this one — never a list, never implying any
   * other Admin-managed number is deleted or replaced.
   */
  phone: string;
  /** Representative, read-only thematic-area labels — see doc comment above. */
  areas: string[];
}

const SEED_COACH_VIEW_PROFILE: CoachViewProfile = {
  fullName: 'Martina Rossi',
  email: 'martina.rossi@coach.com',
  phone: '+39 333 1112233',
  areas: ['Area Umanistica', 'Scienze Politiche'],
};

interface CoachViewProfileContextType {
  profile: CoachViewProfile;
  updateProfile: (patch: Partial<CoachViewProfile>) => void;
}

const CoachViewProfileContext = createContext<CoachViewProfileContextType | undefined>(undefined);

export function CoachViewProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<CoachViewProfile>(SEED_COACH_VIEW_PROFILE);

  const updateProfile = (patch: Partial<CoachViewProfile>) => {
    setProfile((prev) => ({ ...prev, ...patch }));
  };

  return (
    <CoachViewProfileContext.Provider value={{ profile, updateProfile }}>
      {children}
    </CoachViewProfileContext.Provider>
  );
}

export function useCoachViewProfile() {
  const ctx = useContext(CoachViewProfileContext);
  if (!ctx) {
    throw new Error('useCoachViewProfile must be used within a CoachViewProfileProvider');
  }
  return ctx;
}
