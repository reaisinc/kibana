import {
  CommonPageProvider,
  ConsolePageProvider,
  ShieldPageProvider,
  ContextPageProvider,
  DiscoverPageProvider,
  HeaderPageProvider,
  DashboardPageProvider,
  VisualizePageProvider,
  SettingsPageProvider,
  MonitoringPageProvider,
  PointSeriesPageProvider,
  VisualBuilderPageProvider,
} from './page_objects';

import {
  RemoteProvider,
  FilterBarProvider,
  QueryBarProvider,
  FindProvider,
  TestSubjectsProvider,
  DocTableProvider,
  ScreenshotsProvider,
  DashboardVisualizationProvider,
  DashboardExpectProvider,
} from './services';

export default async function ({ readConfigFile }) {
  const commonConfig = await readConfigFile(require.resolve('../common/config'));

  return {
    testFiles: [
      require.resolve('./apps/console'),
      require.resolve('./apps/context'),
      require.resolve('./apps/dashboard'),
      require.resolve('./apps/discover'),
      require.resolve('./apps/management'),
      require.resolve('./apps/status_page'),
      require.resolve('./apps/visualize'),
      require.resolve('./apps/xpack'),
    ],
    pageObjects: {
      common: CommonPageProvider,
      console: ConsolePageProvider,
      shield: ShieldPageProvider,
      context: ContextPageProvider,
      discover: DiscoverPageProvider,
      header: HeaderPageProvider,
      dashboard: DashboardPageProvider,
      visualize: VisualizePageProvider,
      settings: SettingsPageProvider,
      monitoring: MonitoringPageProvider,
      pointSeries: PointSeriesPageProvider,
      visualBuilder: VisualBuilderPageProvider,
    },
    services: {
      es: commonConfig.get('services.es'),
      esArchiver: commonConfig.get('services.esArchiver'),
      kibanaServer: commonConfig.get('services.kibanaServer'),
      kibanaIndex: commonConfig.get('services.kibanaIndex'),
      retry: commonConfig.get('services.retry'),
      remote: RemoteProvider,
      filterBar: FilterBarProvider,
      queryBar: QueryBarProvider,
      find: FindProvider,
      testSubjects: TestSubjectsProvider,
      docTable: DocTableProvider,
      screenshots: ScreenshotsProvider,
      dashboardVisualizations: DashboardVisualizationProvider,
      dashboardExpect: DashboardExpectProvider,
    },
    servers: commonConfig.get('servers'),
    apps: {
      status_page: {
        pathname: '/status',
      },
      discover: {
        pathname: '/app/kibana',
        hash: '/discover',
      },
      context: {
        pathname: '/app/kibana',
        hash: '/context',
      },
      visualize: {
        pathname: '/app/kibana',
        hash: '/visualize',
      },
      dashboard: {
        pathname: '/app/kibana',
        hash: '/dashboards',
      },
      settings: {
        pathname: '/app/kibana',
        hash: '/management',
      },
      console: {
        pathname: '/app/kibana',
        hash: '/dev_tools/console',
      },
    },
  };
}
