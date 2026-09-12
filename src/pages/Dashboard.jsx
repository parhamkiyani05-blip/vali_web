import { useEffect, useState } from 'react';
import { getSession, request } from '../lib/api';

export default function Dashboard() {

  const role = getSession()?.user?.role;

  const [data, setData] = useState(null);
  const [error, setError] = useState('');


  useEffect(() => {

    async function load() {

      try {

        setError('');

        const result = await request('/api/dashboard');

        setData(result);

      } catch (err) {

        setError(
          err.message ||
          'خطا در دریافت اطلاعات داشبورد'
        );

      }

    }

    load();

  }, []);


  // ========================================
  // فرمت پول
  // ========================================
  function money(value, currency, absolute = false) {

    let amount = Number(value || 0);

    if (absolute) {
      amount = Math.abs(amount);
    }

    return `${amount.toLocaleString('en-US')} ${
      currency === 'USD'
        ? '$'
        : 'تومان'
    }`;

  }


  // ========================================
  // نام نوع عملیات
  // ========================================
  function typeLabel(type) {

    if (type === 'receipt') return 'دریافت';

    if (type === 'payment') return 'پرداخت';

    if (type === 'expense') return 'هزینه';

    if (type === 'debt') return 'بدهی';

    return type;

  }


  // ========================================
  // نام نقش
  // ========================================
  function roleLabel() {

    if (role === 'manager') return 'مدیر';

    if (role === 'office') return 'دفتردار';

    return 'کاربر';

  }


  // ========================================
  // خطا
  // ========================================
  if (error) {

    return (

      <section>

        <div className="panel">

          <div className="error">
            {error}
          </div>

        </div>

      </section>

    );

  }


  // ========================================
  // لودینگ
  // ========================================
  if (!data) {

    return (

      <section>

        <div className="panel">
          در حال دریافت اطلاعات داشبورد...
        </div>

      </section>

    );

  }



  // ========================================
  // کاربر عادی
  // ========================================
  if (role === 'employee') {

    return (

      <section>


        <div className="hero">

          <div>

            <span className="eyebrow">
              پنل کاربری
            </span>

            <h2>
              سلام، به VALI خوش آمدی
            </h2>

            <p>
              ثبت راننده، پلاک و هزینه‌های روزانه
            </p>

          </div>


          <div className="hero-truck">

            🚛

            <b>
              VALI
            </b>

          </div>

        </div>



        <div className="cards">


          <div className="stat">

            <span>
              دسترسی
            </span>

            <b>
              ثبت پلاک و هزینه
            </b>

          </div>


          <div className="stat">

            <span>
              واحدهای مالی
            </span>

            <b>
              دلار + تومان
            </b>

          </div>


          <div className="stat">

            <span>
              آخرین ثبت‌ها
            </span>

            <b>
              {data.recent?.length || 0}
            </b>

          </div>


        </div>



        <div className="panel">


          <div className="section-head">

            <div>

              <h3>
                آخرین هزینه‌های شما
              </h3>

              <p>
                آخرین هزینه‌هایی که با حساب شما ثبت شده‌اند
              </p>

            </div>

          </div>


          <table>

            <thead>

              <tr>

                <th>
                  راننده
                </th>

                <th>
                  پلاک
                </th>

                <th>
                  شرح
                </th>

                <th>
                  مبلغ
                </th>

                <th>
                  وضعیت
                </th>

              </tr>

            </thead>


            <tbody>


              {(data.recent || []).map(item => (

                <tr key={`expense-${item.id}`}>

                  <td>
                    {item.driver_name || '—'}
                  </td>

                  <td>
                    {item.plate || '—'}
                  </td>

                  <td>
                    {item.description || '—'}
                  </td>

                  <td>
                    {money(
                      item.amount,
                      item.currency
                    )}
                  </td>

                  <td>

                    {
                      item.status === 'approved'
                        ? 'تأیید'
                        : item.status === 'rejected'
                          ? 'رد'
                          : 'منتظر'
                    }

                  </td>

                </tr>

              ))}


              {!data.recent?.length && (

                <tr>

                  <td colSpan="5">

                    هنوز هزینه‌ای ثبت نکرده‌اید.

                  </td>

                </tr>

              )}


            </tbody>

          </table>


        </div>


      </section>

    );

  }



  // ========================================
  // اطلاعات امروز
  // ========================================

  const driverUSD =
    data.driverToday?.USD || {};

  const driverToman =
    data.driverToday?.TOMAN || {};


  const companyUSD =
    data.companyToday?.USD || {};

  const companyToman =
    data.companyToday?.TOMAN || {};



  // ========================================
  // جمع کل حساب‌ها
  // ========================================

  const driverTotalUSD =
    data.driverTotal?.USD || {};

  const driverTotalToman =
    data.driverTotal?.TOMAN || {};


  const companyTotalUSD =
    data.companyTotal?.USD || {};

  const companyTotalToman =
    data.companyTotal?.TOMAN || {};



  return (

    <section>


      {/* ==================================
          هدر
      ================================== */}

      <div className="hero">


        <div>

          <span className="eyebrow">
            پنل مدیریت
          </span>


          <h2>
            سلام، به VALI خوش آمدی
          </h2>


          <p>
            وضعیت مالی راننده‌ها و شرکت‌ها، آخرین عملیات و جمع کل حساب‌ها
          </p>

        </div>


        <div className="hero-truck">

          🚛

          <b>
            VALI
          </b>

        </div>


      </div>



      {/* ==================================
          کارت‌های بالا
      ================================== */}

      <div className="cards">


        <div className="stat">

          <span>
            دسترسی فعلی
          </span>

          <b>
            {roleLabel()}
          </b>

        </div>


        <div className="stat">

          <span>
            واحدهای مالی
          </span>

          <b>
            USD / TOMAN
          </b>

        </div>


        <div className="stat">

          <span>
            آخرین عملیات
          </span>

          <b>
            {data.recent?.length || 0}
          </b>

        </div>


        <div className="stat">

          <span>
            راننده‌های اخیر
          </span>

          <b>
            {data.drivers?.length || 0}
          </b>

        </div>


      </div>



      {/* ==================================
          جمع کل حساب راننده‌ها
      ================================== */}

      <div className="panel">


        <div className="section-head">

          <div>

            <h3>
              🚛 جمع کل حساب راننده‌ها
            </h3>

            <p>
              جمع حساب تمام راننده‌ها از ابتدا تا امروز
            </p>

          </div>

        </div>



        <h4>
          دلار
        </h4>


        <div className="dashboard-grid">


          <div>

            <small>
              کل دریافت
            </small>

            <strong>

              {money(
                driverTotalUSD.receipt,
                'USD'
              )}

            </strong>

          </div>


          <div>

            <small>
              کل پرداخت
            </small>

            <strong>

              {money(
                driverTotalUSD.payment,
                'USD'
              )}

            </strong>

          </div>


          <div>

            <small>
              کل هزینه
            </small>

            <strong>

              {money(
                driverTotalUSD.expense,
                'USD'
              )}

            </strong>

          </div>


          <div>

            <small>
              جمع کل حساب
            </small>

            <strong>

              {money(
                driverTotalUSD.balance,
                'USD',
                true
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
              کل دریافت
            </small>

            <strong>

              {money(
                driverTotalToman.receipt,
                'TOMAN'
              )}

            </strong>

          </div>


          <div>

            <small>
              کل پرداخت
            </small>

            <strong>

              {money(
                driverTotalToman.payment,
                'TOMAN'
              )}

            </strong>

          </div>


          <div>

            <small>
              کل هزینه
            </small>

            <strong>

              {money(
                driverTotalToman.expense,
                'TOMAN'
              )}

            </strong>

          </div>


          <div>

            <small>
              جمع کل حساب
            </small>

            <strong>

              {money(
                driverTotalToman.balance,
                'TOMAN',
                true
              )}

            </strong>

          </div>


        </div>


      </div>



      {/* ==================================
          جمع کل حساب شرکت‌ها
          فقط مدیر
      ================================== */}

      {
        role === 'manager'
        &&
        data.companyTotal
        &&
        (

          <div className="panel">


            <div className="section-head">

              <div>

                <h3>
                  🏢 جمع کل حساب شرکت‌ها
                </h3>

                <p>
                  جمع حساب تمام شرکت‌ها از ابتدا تا امروز
                </p>

              </div>

            </div>



            <h4>
              دلار
            </h4>


            <div className="dashboard-grid">


              <div>

                <small>
                  کل دریافت
                </small>

                <strong>

                  {money(
                    companyTotalUSD.receipt,
                    'USD'
                  )}

                </strong>

              </div>


              <div>

                <small>
                  کل پرداخت
                </small>

                <strong>

                  {money(
                    companyTotalUSD.payment,
                    'USD'
                  )}

                </strong>

              </div>


              <div>

                <small>
                  کل بدهی
                </small>

                <strong>

                  {money(
                    companyTotalUSD.debt,
                    'USD',
                    true
                  )}

                </strong>

              </div>


              <div>

                <small>
                  جمع کل حساب
                </small>

                <strong>

                  {money(
                    companyTotalUSD.balance,
                    'USD',
                    true
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
                  کل دریافت
                </small>

                <strong>

                  {money(
                    companyTotalToman.receipt,
                    'TOMAN'
                  )}

                </strong>

              </div>


              <div>

                <small>
                  کل پرداخت
                </small>

                <strong>

                  {money(
                    companyTotalToman.payment,
                    'TOMAN'
                  )}

                </strong>

              </div>


              <div>

                <small>
                  کل بدهی
                </small>

                <strong>

                  {money(
                    companyTotalToman.debt,
                    'TOMAN',
                    true
                  )}

                </strong>

              </div>


              <div>

                <small>
                  جمع کل حساب
                </small>

                <strong>

                  {money(
                    companyTotalToman.balance,
                    'TOMAN',
                    true
                  )}

                </strong>

              </div>


            </div>


          </div>

        )
      }



      {/* ==================================
          حساب راننده‌ها امروز
      ================================== */}

      <div className="panel">


        <div className="section-head">

          <div>

            <h3>
              🚛 حساب راننده‌ها — امروز
            </h3>

            <p>
              دریافت، پرداخت، هزینه و مانده حساب راننده‌ها
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
              مانده
            </small>

            <strong>

              {money(
                driverUSD.balance,
                'USD',
                true
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
              مانده
            </small>

            <strong>

              {money(
                driverToman.balance,
                'TOMAN',
                true
              )}

            </strong>

          </div>


        </div>


      </div>



      {/* ==================================
          حساب شرکت‌ها امروز
          فقط مدیر
      ================================== */}

      {
        role === 'manager'
        &&
        data.companyToday
        &&
        (

          <div className="panel">


            <div className="section-head">

              <div>

                <h3>
                  🏢 حساب شرکت‌ها — امروز
                </h3>

                <p>
                  دریافت، پرداخت، بدهی و مانده حساب شرکت‌ها
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
                    'USD',
                    true
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
                    'USD',
                    true
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
                    'TOMAN',
                    true
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
                    'TOMAN',
                    true
                  )}

                </strong>

              </div>


            </div>


          </div>

        )
      }



      {/* ==================================
          آخرین عملیات
      ================================== */}

      <div className="panel">


        <div className="section-head">

          <div>

            <h3>
              آخرین عملیات مالی
            </h3>

            <p>
              آخرین دریافت‌ها، پرداخت‌ها و هزینه‌های ثبت‌شده
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
                نوع حساب
              </th>

              <th>
                طرف حساب
              </th>

              <th>
                پلاک
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

              <th>
                ثبت‌کننده
              </th>

            </tr>

          </thead>


          <tbody>


            {(data.recent || []).map(item => (

              <tr
                key={`${item.source}-${item.id}`}
              >


                <td>

                  {
                    item.occurred_at
                      ? new Date(
                          item.occurred_at
                        ).toLocaleString(
                          'fa-IR'
                        )
                      : '—'
                  }

                </td>


                <td>

                  {
                    item.entity_type === 'company'
                      ? 'شرکت'
                      : 'راننده'
                  }

                </td>


                <td>

                  {item.entity_name || '—'}

                </td>


                <td>

                  {item.plate || '—'}

                </td>


                <td>

                  {typeLabel(item.type)}

                </td>


                <td>

                  {item.description || '—'}

                </td>


                <td>

                  {money(
                    item.amount,
                    item.currency
                  )}

                </td>


                <td>

                  {item.created_by_name || '—'}

                </td>


              </tr>

            ))}



            {!data.recent?.length && (

              <tr>

                <td colSpan="8">

                  هنوز عملیات مالی ثبت نشده است.

                </td>

              </tr>

            )}


          </tbody>


        </table>


      </div>



      {/* ==================================
          وضعیت راننده‌ها
      ================================== */}

      <div className="panel">


        <div className="section-head">

          <div>

            <h3>
              وضعیت حساب راننده‌ها
            </h3>

            <p>
              خلاصه پرداخت و دریافت راننده‌های اخیر
            </p>

          </div>

        </div>



        <table>


          <thead>

            <tr>

              <th>
                راننده
              </th>

              <th>
                پلاک
              </th>

              <th>
                پرداخت دلار
              </th>

              <th>
                دریافت دلار
              </th>

              <th>
                پرداخت تومان
              </th>

              <th>
                دریافت تومان
              </th>

            </tr>

          </thead>


          <tbody>


            {(data.drivers || []).map(driver => (

              <tr key={driver.id}>


                <td>
                  {driver.name}
                </td>


                <td>
                  {driver.truck_number}
                </td>


                <td>

                  {money(
                    driver.payment_usd,
                    'USD'
                  )}

                </td>


                <td>

                  {money(
                    driver.receipt_usd,
                    'USD'
                  )}

                </td>


                <td>

                  {money(
                    driver.payment_toman,
                    'TOMAN'
                  )}

                </td>


                <td>

                  {money(
                    driver.receipt_toman,
                    'TOMAN'
                  )}

                </td>


              </tr>

            ))}



            {!data.drivers?.length && (

              <tr>

                <td colSpan="6">

                  هنوز راننده‌ای ثبت نشده است.

                </td>

              </tr>

            )}


          </tbody>


        </table>


      </div>


    </section>

  );

}
