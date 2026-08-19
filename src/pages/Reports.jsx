import { useEffect, useMemo, useState } from 'react';
import { getSession, request } from '../lib/api';

export default function Reports() {
  const role = getSession()?.user?.role;

  const [entityType, setEntityType] = useState('driver');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const [data, setData] = useState(null);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);


  async function loadReport() {
    setLoading(true);
    setMsg('');

    try {
      const params = new URLSearchParams();

      params.set('entityType', entityType);

      if (from) {
        params.set('from', from);
      }

      if (to) {
        params.set('to', to);
      }

      const result = await request(
        `/api/reports/financial?${params.toString()}`
      );

      setData(result);

    } catch (error) {
      setMsg(
        error.message ||
        'خطا در دریافت گزارش مالی'
      );
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    loadReport();
  }, []);


  function money(value, currency) {
    return `${Number(value || 0).toLocaleString()} ${
      currency === 'USD'
        ? '$'
        : 'تومان'
    }`;
  }


  function typeLabel(type) {
    if (type === 'receipt') return 'دریافت';
    if (type === 'payment') return 'پرداخت';
    if (type === 'expense') return 'هزینه';
    if (type === 'debt') return 'بدهی';

    return type;
  }


  function entityLabel(type) {
    if (type === 'company') return 'شرکت';
    if (type === 'driver') return 'راننده';

    return type;
  }


  function formatDate(value) {
    if (!value) return '—';

    try {
      return new Date(value)
        .toLocaleString('fa-IR');
    } catch {
      return value;
    }
  }


  const driverUSD =
    data?.driverSummary?.USD || {};

  const driverToman =
    data?.driverSummary?.TOMAN || {};

  const companyUSD =
    data?.companySummary?.USD || {};

  const companyToman =
    data?.companySummary?.TOMAN || {};


  const rowCount = useMemo(
    () => data?.rows?.length || 0,
    [data]
  );


  return (
    <section>

      <div className="section-head">

        <div>
          <h2>
            گزارش‌های مالی
          </h2>

          <p>
            گزارش راننده‌ها و شرکت‌ها بر اساس بازه زمانی
          </p>
        </div>

      </div>


      <div className="panel">

        <div className="grid-form">

          <label>
            نوع گزارش

            <select
              value={entityType}
              onChange={e =>
                setEntityType(
                  e.target.value
                )
              }
            >

              <option value="driver">
                راننده‌ها
              </option>


              {role === 'manager' && (
                <option value="company">
                  شرکت‌ها
                </option>
              )}


              {role === 'manager' && (
                <option value="all">
                  همه حساب‌ها
                </option>
              )}

            </select>
          </label>


          <label>
            از تاریخ

            <input
              type="date"
              value={from}
              onChange={e =>
                setFrom(e.target.value)
              }
            />
          </label>


          <label>
            تا تاریخ

            <input
              type="date"
              value={to}
              onChange={e =>
                setTo(e.target.value)
              }
            />
          </label>


          <button
            onClick={loadReport}
            disabled={loading}
          >
            {loading
              ? 'در حال دریافت...'
              : 'نمایش گزارش'}
          </button>

        </div>


        {msg && (
          <div className="notice">
            {msg}
          </div>
        )}

      </div>


      {data && (

        <>

          <div className="cards">

            <div className="stat">
              <span>
                تعداد عملیات
              </span>

              <b>
                {rowCount}
              </b>
            </div>


            <div className="stat">
              <span>
                نوع گزارش
              </span>

              <b>
                {entityType === 'driver'
                  ? 'راننده‌ها'
                  : entityType === 'company'
                    ? 'شرکت‌ها'
                    : 'همه حساب‌ها'}
              </b>
            </div>


            <div className="stat">
              <span>
                از تاریخ
              </span>

              <b>
                {from || 'همه'}
              </b>
            </div>


            <div className="stat">
              <span>
                تا تاریخ
              </span>

              <b>
                {to || 'همه'}
              </b>
            </div>

          </div>


          {data.driverSummary && (

            <div className="panel">

              <div className="section-head">
                <div>
                  <h3>
                    🚛 گزارش حساب راننده‌ها
                  </h3>

                  <p>
                    جمع دریافت، پرداخت، هزینه، بدهی و مانده
                  </p>
                </div>
              </div>


              <h4>
                دلار
              </h4>

              <div className="dashboard-grid">

                <div>
                  <small>
                    دریافت
                  </small>

                  <strong>
                    {money(
                      driverUSD.receipt,
                      'USD'
                    )}
                  </strong>
                </div>


                <div>
                  <small>
                    پرداخت
                  </small>

                  <strong>
                    {money(
                      driverUSD.payment,
                      'USD'
                    )}
                  </strong>
                </div>


                <div>
                  <small>
                    هزینه
                  </small>

                  <strong>
                    {money(
                      driverUSD.expense,
                      'USD'
                    )}
                  </strong>
                </div>


                <div>
                  <small>
                    بدهی
                  </small>

                  <strong>
                    {money(
                      driverUSD.debt,
                      'USD'
                    )}
                  </strong>
                </div>


                <div>
                  <small>
                    مانده
                  </small>

                  <strong>
                    {money(
                      driverUSD.balance,
                      'USD'
                    )}
                  </strong>
                </div>

              </div>


              <h4>
                تومان
              </h4>

              <div className="dashboard-grid">

                <div>
                  <small>
                    دریافت
                  </small>

                  <strong>
                    {money(
                      driverToman.receipt,
                      'TOMAN'
                    )}
                  </strong>
                </div>


                <div>
                  <small>
                    پرداخت
                  </small>

                  <strong>
                    {money(
                      driverToman.payment,
                      'TOMAN'
                    )}
                  </strong>
                </div>


                <div>
                  <small>
                    هزینه
                  </small>

                  <strong>
                    {money(
                      driverToman.expense,
                      'TOMAN'
                    )}
                  </strong>
                </div>


                <div>
                  <small>
                    بدهی
                  </small>

                  <strong>
                    {money(
                      driverToman.debt,
                      'TOMAN'
                    )}
                  </strong>
                </div>


                <div>
                  <small>
                    مانده
                  </small>

                  <strong>
                    {money(
                      driverToman.balance,
                      'TOMAN'
                    )}
                  </strong>
                </div>

              </div>

            </div>

          )}


          {data.companySummary && (

            <div className="panel">

              <div className="section-head">
                <div>
                  <h3>
                    🏢 گزارش حساب شرکت‌ها
                  </h3>

                  <p>
                    جمع دریافت، پرداخت، بدهی و مانده
                  </p>
                </div>
              </div>


              <h4>
                دلار
              </h4>

              <div className="dashboard-grid">

                <div>
                  <small>
                    دریافت
                  </small>

                  <strong>
                    {money(
                      companyUSD.receipt,
                      'USD'
                    )}
                  </strong>
                </div>


                <div>
                  <small>
                    پرداخت
                  </small>

                  <strong>
                    {money(
                      companyUSD.payment,
                      'USD'
                    )}
                  </strong>
                </div>


                <div>
                  <small>
                    بدهی
                  </small>

                  <strong>
                    {money(
                      companyUSD.debt,
                      'USD'
                    )}
                  </strong>
                </div>


                <div>
                  <small>
                    مانده
                  </small>

                  <strong>
                    {money(
                      companyUSD.balance,
                      'USD'
                    )}
                  </strong>
                </div>

              </div>


              <h4>
                تومان
              </h4>

              <div className="dashboard-grid">

                <div>
                  <small>
                    دریافت
                  </small>

                  <strong>
                    {money(
                      companyToman.receipt,
                      'TOMAN'
                    )}
                  </strong>
                </div>


                <div>
                  <small>
                    پرداخت
                  </small>

                  <strong>
                    {money(
                      companyToman.payment,
                      'TOMAN'
                    )}
                  </strong>
                </div>


                <div>
                  <small>
                    بدهی
                  </small>

                  <strong>
                    {money(
                      companyToman.debt,
                      'TOMAN'
                    )}
                  </strong>
                </div>


                <div>
                  <small>
                    مانده
                  </small>

                  <strong>
                    {money(
                      companyToman.balance,
                      'TOMAN'
                    )}
                  </strong>
                </div>

              </div>

            </div>

          )}


          <div className="panel">

            <div className="section-head">

              <div>
                <h3>
                  ریز عملیات مالی
                </h3>

                <p>
                  تمام عملیات موجود در بازه انتخاب‌شده
                </p>
              </div>

            </div>


            <table>

              <thead>

                <tr>
                  <th>تاریخ</th>
                  <th>نوع حساب</th>
                  <th>طرف حساب</th>
                  <th>پلاک</th>
                  <th>نوع عملیات</th>
                  <th>شرح</th>
                  <th>مبلغ</th>
                  <th>ثبت‌کننده</th>
                </tr>

              </thead>


              <tbody>

                {(data.rows || []).map(
                  item => (

                    <tr key={item.id}>

                      <td>
                        {formatDate(
                          item.occurredAt
                        )}
                      </td>


                      <td>
                        {entityLabel(
                          item.entityType
                        )}
                      </td>


                      <td>
                        {item.entityName ||
                          '—'}
                      </td>


                      <td>
                        {item.plate ||
                          '—'}
                      </td>


                      <td>
                        {typeLabel(
                          item.type
                        )}
                      </td>


                      <td>
                        {item.description ||
                          '—'}
                      </td>


                      <td>
                        {money(
                          item.amount,
                          item.currency
                        )}
                      </td>


                      <td>
                        {item.createdByName ||
                          '—'}
                      </td>

                    </tr>

                  )
                )}


                {!data.rows?.length && (

                  <tr>

                    <td colSpan="8">
                      در این بازه زمانی عملیات مالی ثبت نشده است.
                    </td>

                  </tr>

                )}

              </tbody>

            </table>

          </div>

        </>

      )}

    </section>
  );
}
