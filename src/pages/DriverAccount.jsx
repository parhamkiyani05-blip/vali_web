import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { request } from '../lib/api';

export default function DriverAccount() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        setData(await request(`/api/drivers/${id}/account`));
      } catch (err) {
        setError(err.message || 'خطا در دریافت حساب راننده');
      }
    }

    load();
  }, [id]);

  const summary = useMemo(() => {
    if (!data) return null;

    const result = {
      USD: {
        payment: 0,
        receipt: 0,
        expense: 0,
        balance: 0
      },
      TOMAN: {
        payment: 0,
        receipt: 0,
        expense: 0,
        balance: 0
      }
    };

    for (const item of data.transactions || []) {
      const currency = item.currency;

      if (!result[currency]) continue;

      const amount = Number(item.amount || 0);

      if (item.type === 'payment') {
        result[currency].payment += amount;
      }

      if (item.type === 'receipt') {
        result[currency].receipt += amount;
      }

      if (item.type === 'debt') {
        result[currency].payment += amount;
      }
    }

    for (const item of data.expenses || []) {
      const currency = item.currency;

      if (!result[currency]) continue;

      result[currency].expense += Number(item.amount || 0);
    }

    for (const currency of ['USD', 'TOMAN']) {
      result[currency].balance =
        result[currency].payment +
        result[currency].expense -
        result[currency].receipt;
    }

    return result;
  }, [data]);

  const rows = useMemo(() => {
    if (!data) return [];

    const transactions = (data.transactions || []).map(item => ({
      ...item,
      source: 'transaction'
    }));

    const expenses = (data.expenses || []).map(item => ({
      ...item,
      type: 'expense',
      source: 'expense'
    }));

    return [...transactions, ...expenses].sort(
      (a, b) =>
        new Date(b.occurred_at).getTime() -
        new Date(a.occurred_at).getTime()
    );
  }, [data]);

  function typeLabel(type) {
    if (type === 'payment') return 'پرداخت';
    if (type === 'receipt') return 'دریافت';
    if (type === 'expense') return 'هزینه';
    if (type === 'debt') return 'بدهی';

    return type;
  }

  function money(value, currency) {
    return `${Number(value || 0).toLocaleString()} ${
      currency === 'USD' ? '$' : 'تومان'
    }`;
  }

  if (error) {
    return (
      <section>
        <div className="panel">

          <div className="error">
            {error}
          </div>

          <button
            onClick={() => navigate('/drivers')}
          >
            بازگشت
          </button>

        </div>
      </section>
    );
  }

  if (!data || !summary) {
    return (
      <section>
        <div className="panel">
          در حال دریافت حساب راننده...
        </div>
      </section>
    );
  }

  const { driver } = data;

  return (
    <section>

      <div className="section-head">

        <div>

          <h2>
            حساب راننده
          </h2>

          <p>
            {driver.name} - {driver.truck_number}
          </p>

        </div>


        <div className="actions">

          <button
            onClick={() =>
              navigate(`/invoice/driver/${id}`)
            }
          >
            فاکتور
          </button>


          <button
            className="ghost"
            onClick={() =>
              navigate('/drivers')
            }
          >
            بازگشت
          </button>

        </div>

      </div>


      <div className="panel">

        <h3>
          {driver.name}
        </h3>

        <p>
          پلاک:{' '}
          <strong>
            {driver.truck_number}
          </strong>
        </p>

        <p>
          شماره تماس: {driver.phone || '-'}
        </p>

      </div>


      <div className="panel">

        <h3>
          حساب دلار
        </h3>

        <div className="dashboard-grid">

          <div>

            <small>
              پرداخت
            </small>

            <strong>
              {money(summary.USD.payment, 'USD')}
            </strong>

          </div>


          <div>

            <small>
              دریافت
            </small>

            <strong>
              {money(summary.USD.receipt, 'USD')}
            </strong>

          </div>


          <div>

            <small>
              هزینه
            </small>

            <strong>
              {money(summary.USD.expense, 'USD')}
            </strong>

          </div>


          <div>

            <small>
              مانده
            </small>

            <strong>
              {money(summary.USD.balance, 'USD')}
            </strong>

          </div>

        </div>

      </div>


      <div className="panel">

        <h3>
          حساب تومان
        </h3>

        <div className="dashboard-grid">

          <div>

            <small>
              پرداخت
            </small>

            <strong>
              {money(summary.TOMAN.payment, 'TOMAN')}
            </strong>

          </div>


          <div>

            <small>
              دریافت
            </small>

            <strong>
              {money(summary.TOMAN.receipt, 'TOMAN')}
            </strong>

          </div>


          <div>

            <small>
              هزینه
            </small>

            <strong>
              {money(summary.TOMAN.expense, 'TOMAN')}
            </strong>

          </div>


          <div>

            <small>
              مانده
            </small>

            <strong>
              {money(summary.TOMAN.balance, 'TOMAN')}
            </strong>

          </div>

        </div>

      </div>


      <div className="panel">

        <div className="section-head">

          <div>

            <h3>
              ریز حساب
            </h3>

            <p>
              تمام پرداخت‌ها، دریافت‌ها و هزینه‌ها
            </p>

          </div>

        </div>


        <table>

          <thead>

            <tr>

              <th>
                تاریخ
              </th>

              <th>
                نوع
              </th>

              <th>
                شرح
              </th>

              <th>
                مبلغ
              </th>

            </tr>

          </thead>


          <tbody>

            {rows.map(item => (

              <tr
                key={`${item.source}-${item.id}`}
              >

                <td>
                  {new Date(
                    item.occurred_at
                  ).toLocaleString('fa-IR')}
                </td>


                <td>
                  {typeLabel(item.type)}
                </td>


                <td>
                  {item.description || '-'}
                </td>


                <td>
                  {money(
                    item.amount,
                    item.currency
                  )}
                </td>

              </tr>

            ))}


            {!rows.length && (

              <tr>

                <td colSpan="4">
                  هنوز تراکنشی برای این راننده ثبت نشده است.
                </td>

              </tr>

            )}

          </tbody>

        </table>

      </div>

    </section>
  );
}
