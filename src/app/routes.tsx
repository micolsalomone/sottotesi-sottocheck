import { createBrowserRouter, redirect } from 'react-router';
import { AdminLayout } from './components/AdminLayout';
import { Dashboard } from './pages/Dashboard';
import { PipelinesPage } from './pages/PipelinesPage';
import { StudentiPage } from './pages/StudentiPage';
import { CoachPage } from './pages/CoachPage';
import { CatalogoServiziPage } from './pages/CatalogoServiziPage';
import { ServiziStudentiPage } from './pages/ServiziStudentiPage';
import { FatturePage } from './pages/FatturePage';
import { DocumentiPage } from './pages/DocumentiPage';
import { TimelinePage } from './pages/TimelinePage';
import { JobPage } from './pages/JobPage';
import { EventiSistemaPage } from './pages/EventiSistemaPage';
import { KpiMonitoraggioPage } from './pages/KpiMonitoraggioPage';
import { AreeTematichePage } from './pages/AreeTematichePage';
import { LavorazioniSottocheckPage } from './pages/LavorazioniSottocheckPage';
import { ImpostazioniSottocheckPage } from './pages/ImpostazioniSottocheckPage';
import { ProfiliAdminPage } from './pages/ProfiliAdminPage';
import { InfoAccountPage } from './pages/InfoAccountPage';
import { ImpostazioniFontiPage } from './pages/ImpostazioniFontiPage';

// Router configuration — v2.0
export const router = createBrowserRouter([
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
      { path: 'coach', Component: CoachPage },
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
]);