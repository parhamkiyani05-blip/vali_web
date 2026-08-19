import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Building2,
  FileText,
  Gauge,
  LogOut,
  ReceiptText,
  Truck,
  Users
} from 'lucide-react';

import ConnectionBadge from './ConnectionBadge';
import {
  clearSession,
  getSession
} from '../lib/api';


export default function Layout() {

  const nav = useNavigate();
  const session = getSession();
  const role = session?.user?.role;


  const links = [

    [
      '/',
      Gauge,
      'داشبورد'
    ],


    [
      '/drivers',
      Truck,
      role === 'employee'
        ? 'ثبت راننده و پلاک'
        : 'راننده‌ها'
    ],


    ...(role === 'manager'
      ? [
          [
            '/companies',
            Building2,
            'شرکت‌ها'
          ]
        ]
      : []
    ),


    [
      '/expenses',
      ReceiptText,
      role === 'employee'
        ? 'ثبت هزینه'
        : 'هزینه‌ها'
    ],


    ...(role === 'manager'
      ? [
          [
            '/users',
            Users,
            'کارمندان'
          ]
        ]
      : []
    ),


    ...(role !== 'employee'
      ? [
          [
            '/invoice',
            FileText,
            'فاکتور A5'
          ]
        ]
      : []
    )

  ];


  function logout() {

    clearSession();

    nav('/login');

  }


  function roleLabel() {

    if (role === 'manager') {
      return 'مدیر';
    }

    if (role === 'office') {
      return 'دفتردار';
    }

    return 'کارمند';

  }


  return (

    <div className="app-shell">

      <aside className="sidebar">

        <div className="brand">

          <div className="brand-mark">
            V
          </div>

          <div>

            <b>
              VALI
            </b>

            <span>
              TRANSPORT
            </span>

          </div>

        </div>


        <nav>

          {links.map(([to, Icon, label]) => (

            <NavLink
              key={to}
              to={to}
              end={to === '/'}
            >

              <Icon size={19} />

              {label}

            </NavLink>

          ))}

        </nav>


        <button
          className="logout"
          onClick={logout}
        >

          <LogOut size={18} />

          خروج

        </button>

      </aside>


      <main className="main">

        <header>

          <div>

            <h1>
              VALI Transport System
            </h1>

            <p>
              {session?.user?.fullName}
              {' · '}
              {roleLabel()}
            </p>

          </div>


          <ConnectionBadge />

        </header>


        <Outlet />

      </main>

    </div>

  );

}
