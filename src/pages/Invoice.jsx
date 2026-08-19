import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { labels } from '../lib/i18n';
import { request } from '../lib/api';

export default function Invoice() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [lang, setLang] = useState('fa');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const t = labels[lang];
  const rtl = lang === 'fa';

  const isCompany = location.pathname.includes('/invoice/company/');
  const isDriver = location.pathname.includes('/invoice/driver/');

  useEffect(() => {
    async function load() {
      try {
        setError('');

        if (isCompany && id) {
          const result = await request(`/api/companies/${id}/account`);
          setData({
            entityType: 'company',
            entity: result.company,
            transactions: result.transactions || [],
            expenses: []
          });

          if (result.company?.language) {
            setLang(result.company.language);
          }

          return;
        }

        if (isDriver && id) {
          const result = await request(`/api/drivers/${id}/account`);

          setData({
            entityType: 'driver',
            entity: result.driver,
            transactions: result.transactions || [],
            expenses: result.expenses || []
          });

          return;
        }

        setError('فاکتور باید از حساب یک راننده یا شرکت باز شود.');

      } catch (err) {
        setError(err.message || 'خطا در دریافت اطلاعات فاکتور');
      }
    }

    load();
  }, [id, isCompany, isDriver]);

  const rows = useMemo(() => {
    if (!data) return [];

    const transactionRows = (data.transactions || []).map(item => ({
      id: `t-${item.id}`,
      type: item.type,
      amount: Number(item.amount || 0),
      currency: item.currency,
      description: item.description || '',
      occurredAt: item.occurred_at,
      source: 'transaction'
    }));

    const expenseRows = (data.expenses || []).map(item => ({
      id: `e-${item.id}`,
      type: 'expense',
      amount: Number(item.amount || 0),
      currency: item.currency,
      description: item.description || '',
      occurredAt: item.occurred_at,
      source: 'expense'
    }));

    return [...transactionRows, ...expenseRows].sort(
      (a, b) =>
        new Date(a.occurredAt).getTime() -
        new Date(b.occurredAt).getTime()
    );
  }, [data]);

  const totals = useMemo(() => {
    const result = {
      USD: {
        receipt: 0,
        payment: 0,
        expense: 0,
        debt: 0,
        balance: 0
      },
      TOMAN: {
        receipt: 0,
        payment: 0,
        expense: 0,
        debt: 0,
        balance: 0
      }
    };

    for (const row of rows) {
      if (!result[row.currency]) continue;

      if (row.type === 'receipt') {
        result[row.currency].receipt += row.amount;
      }

      if (row.type === 'payment') {
        result[row.currency].payment += row.amount;
      }

      if (row.type === 'expense') {
        result[row.currency].expense += row.amount;
      }

      if (row.type === 'debt') {
        result[row.currency].debt += row.amount;
      }
    }

    for (const currency of ['USD', 'TOMAN']) {
      if (data?.entityType === 'company') {
        result[currency].balance =
          result[currency].receipt -
          result[currency].payment -
          result[currency].debt;
      } else {
        result[currency].balance =
          result[currency].payment +
          result[currency].expense +
          result[currency].debt -
          result[currency].receipt;
      }
    }

    return result;
  }, [rows, data]);

  function money(value, currency) {
    return `${Number(value || 0).toLocaleString()} ${
      currency === 'USD' ? '$' : 'تومان'
    }`;
  }

  function typeLabel(type) {
    if (lang === 'tr') {
      if (type === 'receipt') return 'Tahsilat';
      if (type === 'payment') return 'Ödeme';
      if (type === 'expense') return 'Masraf';
      if (type === 'debt') return 'Borç';
    }

    if (type === 'receipt') return 'دریافت';
    if (type === 'payment') return 'پرداخت';
    if (type === 'expense') return 'هزینه';
    if (type === 'debt') return 'بدهی';

    return type;
  }

  function formatDate(value) {
    if (!value) return '—';

    try {
      return new Date(value).toLocaleDateString(
        lang === 'fa' ? 'fa-IR' : 'tr-TR'
      );
    } catch {
      return value;
    }
  }

  if (error) {
    return (
      <section>
        <div className="panel">
          <div className="error">{error}</div>

          <button
            onClick={() => navigate(-1)}
          >
            بازگشت
          </button>
        </div>
      </section>
    );
  }

  if (!data) {
    return (
      <section>
        <div className="panel">
          در حال آماده‌سازی فاکتور...
        </div>
      </section>
    );
  }

  const entity = data.entity;

  const invoiceNumber =
    `VT-${data.entityType === 'company' ? 'C' : 'D'}-${String(id).padStart(6, '0')}`;

  return (
    <section>

      <div className="section-head no-print">

        <div>
          <h2>فاکتور حساب</h2>

          <p>
            ریز تراکنش‌ها، جمع دلار و تومان و خروجی مخصوص چاپ A5
          </p>
        </div>

        <div className="actions">

          <select
            value={lang}
            onChange={e => setLang(e.target.value)}
          >
            <option value="fa">
              فارسی
            </option>

            <option value="tr">
              Türkçe
            </option>
          </select>


          <button
            className="ghost"
            onClick={() => navigate(-1)}
          >
            بازگشت
          </button>


          <button
            onClick={() => window.print()}
          >
            چاپ / PDF
          </button>

        </div>

      </div>


      <div
        className="invoice-sheet"
        dir={rtl ? 'rtl' : 'ltr'}
      >

        <div className="invoice-top">

          <div>
            <h1>VALI TRANSPORT</h1>

            <p>
              {t.invoice || 'Invoice'} #{invoiceNumber}
            </p>
          </div>

          <div className="invoice-badge">
            A5
          </div>

        </div>


        <div className="invoice-info">

          {data.entityType === 'driver' ? (
            <>
              <span>
                <b>{t.driver || 'راننده'}:</b>{' '}
                {entity.name}
              </span>

              <span>
                <b>{t.truck || 'پلاک'}:</b>{' '}
                {entity.truck_number}
              </span>

              <span>
                <b>{t.phone || 'تماس'}:</b>{' '}
                {entity.phone || '—'}
              </span>
            </>
          ) : (
            <>
              <span>
                <b>{lang === 'tr' ? 'Firma' : 'شرکت'}:</b>{' '}
                {entity.name}
              </span>

              <span>
                <b>{t.phone || 'تماس'}:</b>{' '}
                {entity.phone || '—'}
              </span>

              {entity.note && (
                <span>
                  <b>{lang === 'tr' ? 'Not' : 'یادداشت'}:</b>{' '}
                  {entity.note}
                </span>
              )}
            </>
          )}

        </div>


        <table>

          <thead>

            <tr>
              <th>{t.date || 'تاریخ'}</th>
              <th>{t.description || 'شرح'}</th>
              <th>{lang === 'tr' ? 'Tür' : 'نوع'}</th>
              <th>{lang === 'tr' ? 'Tutar' : 'مبلغ'}</th>
            </tr>

          </thead>


          <tbody>

            {rows.map(row => (

              <tr key={row.id}>

                <td>
                  {formatDate(row.occurredAt)}
                </td>

                <td>
                  {row.description || '—'}
                </td>

                <td>
                  {typeLabel(row.type)}
                </td>

                <td>
                  {money(row.amount, row.currency)}
                </td>

              </tr>

            ))}


            {!rows.length && (

              <tr>
                <td colSpan="4">
                  {lang === 'tr'
                    ? 'Henüz işlem bulunmuyor.'
                    : 'هنوز تراکنشی ثبت نشده است.'
                  }
                </td>
              </tr>

            )}

          </tbody>

        </table>


        <div className="invoice-totals">

          <div>
            <span>
              {lang === 'tr' ? 'USD Tahsilat' : 'دریافت دلار'}
            </span>

            <b>
              {money(totals.USD.receipt, 'USD')}
            </b>
          </div>


          <div>
            <span>
              {lang === 'tr' ? 'USD Ödeme' : 'پرداخت دلار'}
            </span>

            <b>
              {money(totals.USD.payment, 'USD')}
            </b>
          </div>


          {data.entityType === 'driver' && (
            <div>
              <span>
                {lang === 'tr' ? 'USD Masraf' : 'هزینه دلار'}
              </span>

              <b>
                {money(totals.USD.expense, 'USD')}
              </b>
            </div>
          )}


          <div>
            <span>
              {lang === 'tr' ? 'USD Bakiye' : 'مانده دلار'}
            </span>

            <b>
              {money(totals.USD.balance, 'USD')}
            </b>
          </div>


          <div>
            <span>
              {lang === 'tr' ? 'Toman Tahsilat' : 'دریافت تومان'}
            </span>

            <b>
              {money(totals.TOMAN.receipt, 'TOMAN')}
            </b>
          </div>


          <div>
            <span>
              {lang === 'tr' ? 'Toman Ödeme' : 'پرداخت تومان'}
            </span>

            <b>
              {money(totals.TOMAN.payment, 'TOMAN')}
            </b>
          </div>


          {data.entityType === 'driver' && (
            <div>
              <span>
                {lang === 'tr' ? 'Toman Masraf' : 'هزینه تومان'}
              </span>

              <b>
                {money(totals.TOMAN.expense, 'TOMAN')}
              </b>
            </div>
          )}


          <div>
            <span>
              {lang === 'tr' ? 'Toman Bakiye' : 'مانده تومان'}
            </span>

            <b>
              {money(totals.TOMAN.balance, 'TOMAN')}
            </b>
          </div>

        </div>


        <footer>

          <div>
            <b>VAHID VALI</b>
            <span>TEL: 09120801384</span>
          </div>

          <div>
            <b>HABIB VALI</b>
            <span>TEL: 09147257526</span>
          </div>

          <div className="sign">
            Signature / امضا
          </div>

        </footer>

      </div>

    </section>
  );
}
