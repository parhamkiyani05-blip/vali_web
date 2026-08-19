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

  const [rangeMode, setRangeMode] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const t = labels[lang] || {};
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

          if (result.driver?.language) {
            setLang(result.driver.language);
          }

          return;
        }

        setError(
          lang === 'tr'
            ? 'Fatura bir sürücü veya firma hesabından açılmalıdır.'
            : 'فاکتور باید از حساب یک راننده یا شرکت باز شود.'
        );

      } catch (err) {
        setError(
          err.message ||
          (lang === 'tr'
            ? 'Fatura bilgileri alınamadı.'
            : 'خطا در دریافت اطلاعات فاکتور')
        );
      }
    }

    load();
  }, [id, isCompany, isDriver]);

  const allRows = useMemo(() => {
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

  const filteredRows = useMemo(() => {
    if (rangeMode === 'all') {
      return allRows;
    }

    const now = new Date();

    if (rangeMode === 'month') {
      const start = new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
        0,
        0,
        0,
        0
      );

      const end = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );

      return allRows.filter(row => {
        const date = new Date(row.occurredAt);
        return date >= start && date <= end;
      });
    }

    if (rangeMode === 'custom') {
      return allRows.filter(row => {
        const date = new Date(row.occurredAt);

        if (fromDate) {
          const start = new Date(`${fromDate}T00:00:00`);

          if (date < start) {
            return false;
          }
        }

        if (toDate) {
          const end = new Date(`${toDate}T23:59:59`);

          if (date > end) {
            return false;
          }
        }

        return true;
      });
    }

    return allRows;
  }, [allRows, rangeMode, fromDate, toDate]);

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

    for (const row of filteredRows) {
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
  }, [filteredRows, data]);

  function money(value, currency) {
    return `${Number(value || 0).toLocaleString()} ${
      currency === 'USD'
        ? '$'
        : lang === 'tr'
          ? 'Toman'
          : 'تومان'
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

  function rangeLabel() {
    if (rangeMode === 'all') {
      return lang === 'tr'
        ? 'Tüm işlemler'
        : 'همه تراکنش‌ها';
    }

    if (rangeMode === 'month') {
      return lang === 'tr'
        ? 'Bu ay'
        : 'این ماه';
    }

    if (rangeMode === 'custom') {
      if (fromDate && toDate) {
        return `${fromDate} - ${toDate}`;
      }

      if (fromDate) {
        return `${lang === 'tr' ? 'Başlangıç' : 'از'} ${fromDate}`;
      }

      if (toDate) {
        return `${lang === 'tr' ? 'Bitiş' : 'تا'} ${toDate}`;
      }

      return lang === 'tr'
        ? 'Özel tarih aralığı'
        : 'بازه دلخواه';
    }

    return '';
  }

  if (error) {
    return (
      <section>
        <div className="panel">

          <div className="error">
            {error}
          </div>

          <button onClick={() => navigate(-1)}>
            {lang === 'tr' ? 'Geri' : 'بازگشت'}
          </button>

        </div>
      </section>
    );
  }

  if (!data) {
    return (
      <section>
        <div className="panel">
          {lang === 'tr'
            ? 'Fatura hazırlanıyor...'
            : 'در حال آماده‌سازی فاکتور...'}
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

          <h2>
            {lang === 'tr'
              ? 'Hesap Faturası'
              : 'فاکتور حساب'}
          </h2>

          <p>
            {lang === 'tr'
              ? 'Tarih aralığı, işlem detayları ve ayrı USD / Toman toplamları'
              : 'بازه زمانی، ریز تراکنش‌ها و جمع مستقل دلار و تومان'}
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
            {lang === 'tr' ? 'Geri' : 'بازگشت'}
          </button>


          <button onClick={() => window.print()}>
            {lang === 'tr'
              ? 'Yazdır / PDF'
              : 'چاپ / PDF'}
          </button>

        </div>

      </div>


      <div className="panel no-print">

        <div className="grid-form">

          <label>

            {lang === 'tr'
              ? 'Fatura dönemi'
              : 'بازه فاکتور'}

            <select
              value={rangeMode}
              onChange={e => setRangeMode(e.target.value)}
            >

              <option value="all">
                {lang === 'tr'
                  ? 'Tüm işlemler'
                  : 'همه تراکنش‌ها'}
              </option>

              <option value="month">
                {lang === 'tr'
                  ? 'Bu ay'
                  : 'این ماه'}
              </option>

              <option value="custom">
                {lang === 'tr'
                  ? 'Özel tarih aralığı'
                  : 'بازه دلخواه'}
              </option>

            </select>

          </label>


          {rangeMode === 'custom' && (
            <>

              <label>

                {lang === 'tr'
                  ? 'Başlangıç tarihi'
                  : 'از تاریخ'}

                <input
                  type="date"
                  value={fromDate}
                  onChange={e => setFromDate(e.target.value)}
                />

              </label>


              <label>

                {lang === 'tr'
                  ? 'Bitiş tarihi'
                  : 'تا تاریخ'}

                <input
                  type="date"
                  value={toDate}
                  onChange={e => setToDate(e.target.value)}
                />

              </label>

            </>
          )}

        </div>

      </div>


      <div
        className="invoice-sheet"
        dir={rtl ? 'rtl' : 'ltr'}
      >

        <div className="invoice-top">

          <div>

            <h1>
              {lang === 'tr'
                ? 'VALİ KARDEŞLER TRANSPORT'
                : 'شرکت حمل و نقل برادران والی'}
            </h1>

            <p>
              {t.invoice || (lang === 'tr' ? 'Fatura' : 'فاکتور')}
              {' '}
              #{invoiceNumber}
            </p>

            <small>
              {rangeLabel()}
            </small>

          </div>


          <div className="invoice-badge">
            A5
          </div>

        </div>


        <div className="invoice-info">

          {data.entityType === 'driver' ? (
            <>

              <span>
                <b>
                  {lang === 'tr'
                    ? 'Sürücü'
                    : (t.driver || 'راننده')}:
                </b>{' '}
                {entity.name}
              </span>


              <span>
                <b>
                  {lang === 'tr'
                    ? 'Plaka'
                    : (t.truck || 'پلاک')}:
                </b>{' '}
                {entity.truck_number}
              </span>


              <span>
                <b>
                  {lang === 'tr'
                    ? 'Telefon'
                    : (t.phone || 'تماس')}:
                </b>{' '}
                {entity.phone || '—'}
              </span>

            </>
          ) : (
            <>

              <span>
                <b>
                  {lang === 'tr' ? 'Firma' : 'شرکت'}:
                </b>{' '}
                {entity.name}
              </span>


              <span>
                <b>
                  {lang === 'tr'
                    ? 'Telefon'
                    : (t.phone || 'تماس')}:
                </b>{' '}
                {entity.phone || '—'}
              </span>


              {entity.note && (

                <span>
                  <b>
                    {lang === 'tr'
                      ? 'Not'
                      : 'یادداشت'}:
                  </b>{' '}
                  {entity.note}
                </span>

              )}

            </>
          )}

        </div>


        <table>

          <thead>

            <tr>

              <th>
                {lang === 'tr'
                  ? 'Tarih'
                  : (t.date || 'تاریخ')}
              </th>

              <th>
                {lang === 'tr'
                  ? 'Açıklama'
                  : (t.description || 'شرح')}
              </th>

              <th>
                {lang === 'tr'
                  ? 'Tür'
                  : 'نوع'}
              </th>

              <th>
                {lang === 'tr'
                  ? 'Tutar'
                  : 'مبلغ'}
              </th>

            </tr>

          </thead>


          <tbody>

            {filteredRows.map(row => (

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


            {!filteredRows.length && (

              <tr>

                <td colSpan="4">
                  {lang === 'tr'
                    ? 'Bu tarih aralığında işlem bulunmuyor.'
                    : 'در این بازه زمانی تراکنشی ثبت نشده است.'}
                </td>

              </tr>

            )}

          </tbody>

        </table>


        <div className="invoice-totals">

          <div>
            <span>
              {lang === 'tr'
                ? 'USD Tahsilat'
                : 'دریافت دلار'}
            </span>

            <b>
              {money(totals.USD.receipt, 'USD')}
            </b>
          </div>


          <div>
            <span>
              {lang === 'tr'
                ? 'USD Ödeme'
                : 'پرداخت دلار'}
            </span>

            <b>
              {money(totals.USD.payment, 'USD')}
            </b>
          </div>


          {data.entityType === 'driver' && (

            <div>

              <span>
                {lang === 'tr'
                  ? 'USD Masraf'
                  : 'هزینه دلار'}
              </span>

              <b>
                {money(totals.USD.expense, 'USD')}
              </b>

            </div>

          )}


          <div>
            <span>
              {lang === 'tr'
                ? 'USD Bakiye'
                : 'مانده دلار'}
            </span>

            <b>
              {money(totals.USD.balance, 'USD')}
            </b>
          </div>


          <div>
            <span>
              {lang === 'tr'
                ? 'Toman Tahsilat'
                : 'دریافت تومان'}
            </span>

            <b>
              {money(totals.TOMAN.receipt, 'TOMAN')}
            </b>
          </div>


          <div>
            <span>
              {lang === 'tr'
                ? 'Toman Ödeme'
                : 'پرداخت تومان'}
            </span>

            <b>
              {money(totals.TOMAN.payment, 'TOMAN')}
            </b>
          </div>


          {data.entityType === 'driver' && (

            <div>

              <span>
                {lang === 'tr'
                  ? 'Toman Masraf'
                  : 'هزینه تومان'}
              </span>

              <b>
                {money(totals.TOMAN.expense, 'TOMAN')}
              </b>

            </div>

          )}


          <div>
            <span>
              {lang === 'tr'
                ? 'Toman Bakiye'
                : 'مانده تومان'}
            </span>

            <b>
              {money(totals.TOMAN.balance, 'TOMAN')}
            </b>
          </div>

        </div>


        <footer>

          <div>
            <b>VAHID VALI</b>
            <span>TEL: +989120801384</span>
          </div>

          <div>
            <b>HABIB VALI</b>
            <span>TEL: +989147257526</span>
          </div>

          <div className="sign">
            {lang === 'tr'
              ? 'İmza'
              : 'امضا'}
          </div>

        </footer>

      </div>

    </section>
  );
}
