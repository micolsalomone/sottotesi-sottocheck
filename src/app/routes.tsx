import { createBrowserRouter, redirect } from 'react-router';

// Admin
import { AdminLayout } from './components/AdminLayout';
import { Dashboard } from '../pages/admin/Dashboard';
import { PipelinesPage } from '../pages/admin/PipelinesPage';
import { StudentiPage } from '../pages/admin/StudentiPage';
import { CoachPage } from '../pages/admin/CoachPage';
import { CatalogoServiziPage } from '../pages/admin/CatalogoServiziPage';
import { ServiziStudentiPage } from '../pages/admin/ServiziStudentiPage';
import { FatturePage } from '../pages/admin/FatturePage';
import { DocumentiPage } from '../pages/admin/DocumentiPage';
import { TimelinePage } from '../pages/admin/TimelinePage';
import { JobPage } from '../pages/admin/JobPage';
import { EventiSistemaPage } from '../pages/admin/EventiSistemaPage';
import { KpiMonitoraggioPage } from '../pages/admin/KpiMonitoraggioPage';
import { AreeTematichePage } from '../pages/admin/AreeTematichePage';
import { LavorazioniSottocheckPage } from '../pages/admin/LavorazioniSottocheckPage';
import { ImpostazioniSottocheckPage } from '../pages/admin/ImpostazioniSottocheckPage';
import { ProfiliAdminPage } from '../pages/admin/ProfiliAdminPage';
import { InfoAccountPage } from '../pages/admin/InfoAccountPage';
import { ImpostazioniFontiPage } from '../pages/admin/ImpostazioniFontiPage';

// Coach View (vista utente — accesso solo tramite URL diretto)
import { CoachLayout } from './components/coach/CoachLayout';
import { StudentLayout } from './components/student/StudentLayout';
import { DashboardPage } from '../pages/coach/DashboardPage';
import { StudentiPage as CoachStudentiPage } from '../pages/coach/StudentiPage';
import { StudentTimelinePage } from '../pages/coach/StudentTimelinePage';
import { SottocheckPage } from '../pages/coach/SottocheckPage';
import { ArchivioPage } from '../pages/coach/ArchivioPage';
import { NotFoundPage } from '../pages/coach/NotFoundPage';
import { STUDENT_VIEW_STUDENT_ID, getStudentViewTimelinePath } from '@/app/utils/studentView';

export const router = createBrowserRouter([
  // Vista Admin
  {
    path: '/',
    Component: AdminLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: 'pipelines', Component: PipelinesPage },
      { path: 'lavorazioni', Component: ServiziStudentiPage },
      { path: 'finanza/compensi-coach', loader: () => redirect('/lavorazioni') },
      { path: 'finanza/incassi', loader: () => redirect('/lavorazioni') },
      { path: 'sottocheck/pagamenti-fatture', Component: FatturePage },
      { path: 'studenti', Component: StudentiPage },
      { path: 'documenti', Component: DocumentiPage },
      { path: 'coach', Component: CoachPage },  // gestione coach lato admin
      { path: 'coaching/timeline', Component: TimelinePage },
      { path: 'sottocheck/job', Component: JobPage },
      { path: 'aree-tematiche', Component: AreeTematichePage },
      { path: 'sottocheck/lavorazioni', Component: LavorazioniSottocheckPage },
      { path: 'sottocheck/impostazioni', Component: ImpostazioniSottocheckPage },
      { path: 'servizi/catalogo', Component: CatalogoServiziPage },
      { path: 'sistema/kpi', Component: KpiMonitoraggioPage },
      { path: 'sistema/eventi', Component: EventiSistemaPage },
      { path: 'impostazioni/fonti', Component: ImpostazioniFontiPage },
      { path: 'impostazioni/profili', Component: ProfiliAdminPage },
      { path: 'impostazioni/account', Component: InfoAccountPage },
      { path: '*', Component: Dashboard },
    ],
  },
  // Vista Coach — solo URL diretto, NON dalla sidebar admin
  {
    path: '/coach-view',
    Component: CoachLayout,
    children: [
      { index: true, Component: DashboardPage },
      { path: 'studenti', Component: CoachStudentiPage },
      { path: 'studenti/:studentId', Component: StudentTimelinePage },
      { path: 'sottocheck', Component: SottocheckPage },
      { path: 'archivio', Component: ArchivioPage },
      { path: '*', Component: NotFoundPage },
    ],
  },
  // Vista Studente — al momento allineata alla coach view
  {
    path: '/student-view',
    Component: StudentLayout,
    children: [
      { index: true, Component: DashboardPage },
      { path: 'studenti', loader: () => redirect(getStudentViewTimelinePath()) },
      {
        path: 'studenti/:studentId',
        loader: ({ params }) => {
          if (params.studentId !== STUDENT_VIEW_STUDENT_ID) {
            return redirect(getStudentViewTimelinePath());
          }
          return null;
        },
        Component: StudentTimelinePage,
      },
      { path: 'sottocheck', Component: SottocheckPage },
      { path: 'archivio', Component: ArchivioPage },
      { path: '*', Component: NotFoundPage },
    ],
  },
]);