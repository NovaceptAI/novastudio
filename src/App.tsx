import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/app-shell';
import { LoadingState, ToastProvider } from '@/components/ui';
import { DataProvider, FiltersProvider } from '@/store/app-store';
import { OverviewPage } from '@/pages/overview';

/**
 * The Overview is the landing screen, so it ships in the initial bundle.
 * Everything else is fetched when it is first visited, which keeps the charts
 * and the heavier detail screens out of the first paint.
 */
const ChannelsPage = lazy(() => import('@/pages/channels').then((m) => ({ default: m.ChannelsPage })));
const ChannelDetailPage = lazy(() =>
  import('@/pages/channel-detail').then((m) => ({ default: m.ChannelDetailPage })),
);
const PipelinePage = lazy(() => import('@/pages/pipeline').then((m) => ({ default: m.PipelinePage })));
const ProjectDetailPage = lazy(() =>
  import('@/pages/project-detail').then((m) => ({ default: m.ProjectDetailPage })),
);
const CalendarPage = lazy(() => import('@/pages/calendar').then((m) => ({ default: m.CalendarPage })));
const AssetsPage = lazy(() => import('@/pages/assets').then((m) => ({ default: m.AssetsPage })));
const AnalyticsPage = lazy(() => import('@/pages/analytics').then((m) => ({ default: m.AnalyticsPage })));
const IntegrationsPage = lazy(() =>
  import('@/pages/integrations').then((m) => ({ default: m.IntegrationsPage })),
);
const SettingsPage = lazy(() => import('@/pages/settings').then((m) => ({ default: m.SettingsPage })));
const NotFoundPage = lazy(() => import('@/pages/not-found').then((m) => ({ default: m.NotFoundPage })));

export default function App() {
  return (
    <ToastProvider>
      <DataProvider>
        <FiltersProvider>
          <Suspense fallback={<LoadingState label="Loading screen…" rows={3} />}>
            <Routes>
              <Route element={<AppShell />}>
                <Route index element={<OverviewPage />} />
                <Route path="channels" element={<ChannelsPage />} />
                <Route path="channels/:slug" element={<ChannelDetailPage />} />
                <Route path="pipeline" element={<PipelinePage />} />
                <Route path="pipeline/:projectId" element={<ProjectDetailPage />} />
                <Route path="calendar" element={<CalendarPage />} />
                <Route path="assets" element={<AssetsPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="integrations" element={<IntegrationsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </Suspense>
        </FiltersProvider>
      </DataProvider>
    </ToastProvider>
  );
}
