import { Navigate, Route, Routes } from 'react-router-dom';

import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Drivers from './pages/Drivers';
import DriverAccount from './pages/DriverAccount';
import Companies from './pages/Companies';
import CompanyAccount from './pages/CompanyAccount';
import Users from './pages/Users';
import Invoice from './pages/Invoice';

import { getSession } from './lib/api';

function Guard({ children, roles }) {
  const s = getSession();

  if (!s) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(s.user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        element={
          <Guard>
            <Layout />
          </Guard>
        }
      >

        <Route
          path="/"
          element={<Dashboard />}
        />

        <Route
          path="/expenses"
          element={<Expenses />}
        />

        <Route
          path="/drivers"
          element={
            <Guard roles={['manager', 'office']}>
              <Drivers />
            </Guard>
          }
        />

        <Route
          path="/drivers/:id/account"
          element={
            <Guard roles={['manager', 'office']}>
              <DriverAccount />
            </Guard>
          }
        />

        <Route
          path="/companies"
          element={
            <Guard roles={['manager']}>
              <Companies />
            </Guard>
          }
        />

        <Route
          path="/companies/:id/account"
          element={
            <Guard roles={['manager']}>
              <CompanyAccount />
            </Guard>
          }
        />

        <Route
          path="/users"
          element={
            <Guard roles={['manager']}>
              <Users />
            </Guard>
          }
        />

        <Route
          path="/invoice"
          element={
            <Guard roles={['manager', 'office']}>
              <Invoice />
            </Guard>
          }
        />

        <Route
          path="/invoice/driver/:id"
          element={
            <Guard roles={['manager', 'office']}>
              <Invoice />
            </Guard>
          }
        />

        <Route
          path="/invoice/company/:id"
          element={
            <Guard roles={['manager']}>
              <Invoice />
            </Guard>
          }
        />

      </Route>

    </Routes>
  );
}
