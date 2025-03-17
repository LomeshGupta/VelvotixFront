import DashboardPage from './pages';
import OrdersPage from './pages/orders';

const router = createBrowserRouter([
  {
    Component: App,
    children: [
      {
        path: '/',
        Component: Layout,
        children: [
          {
            path: '',
            Component: DashboardPage,
          },
          {
            path: 'orders',
            Component: OrdersPage,
          },
        ],
      },
    ],
  },
]);
