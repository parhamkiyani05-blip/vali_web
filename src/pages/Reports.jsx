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


  function formatDate(value) {
    if (!value) return '—';

    try {
      return new Date(value)
        .toLocaleString('fa-IR');
    } catch {
      return value;
    }
  }


  function reportTypeLabel() {
    if (entityType === 'driver') {
      return 'رانندگان';
    }

    if (entityType === 'company') {
      return 'شرکت‌ها';
    }

    return 'رانندگان و شرکت‌ها';
  }


  function printReport() {
    window.print();
  }


  // ========================================
  // خلاصه هر گروه
  // ========================================
  function calculateGroupSummary(rows, groupType) {
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
      if (!result[row.currency]) {
        continue;
      }

      const amount = Number(row.amount || 0);

      if (row.type === 'receipt') {
        result[row.currency].receipt += amount;
      }

      if (row.type === 'payment') {
        result[row.currency].payment += amount;
      }

      if (row.type === 'expense') {
        result[row.currency].expense += amount;
      }

      if (row.type === 'debt') {
        result[row.currency].debt += amount;
      }
    }

    for (const currency of ['USD', 'TOMAN']) {
      if (groupType === 'company') {
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
  }


  // ========================================
  // گروه‌بندی ردیف‌ها بر اساس راننده / شرکت
  // ========================================
  const groupedRows = useMemo(() => {
    const groups = {};

    for (const row of data?.rows || []) {
      const key =
        `${row.entityType}-${row.entityId || row.entityName}`;

      if (!groups[key]) {
        groups[key] = {
          key,
          entityType: row.entityType,
          entityId: row.entityId,
          entityName: row.entityName || 'بدون نام',
          plate: row.plate || '',
          rows: []
        };
      }

      groups[key].rows.push(row);
    }

    return Object.values(groups)
      .map(group => ({
        ...group,
        summary: calculateGroupSummary(
          group.rows,
          group.entityType
        )
      }))
      .sort((a, b) => {
        if (
          a.entityType === 'driver' &&
          b.entityType === 'driver'
        ) {
          return String(a.plate || '')
            .localeCompare(
              String(b.plate || ''),
              'fa'
            );
        }

        return String(a.entityName || '')
          .localeCompare(
            String(b.entityName || ''),
            'fa'
          );
      });

  }, [data]);


  const driverGroups = useMemo(
    () =>
      groupedRows.filter(
        item =>
          item.entityType === 'driver'
      ),
    [groupedRows]
  );


  const companyGroups = useMemo(
    () =>
      groupedRows.filter(
        item =>
          item.entityType === 'company'
      ),
    [groupedRows]
  );


  const rowCount =
    data?.rows?.length || 0;


  const expenseCount = useMemo(
    () =>
      (data?.rows || []).filter(
        row => row.type === 'expense'
      ).length,
    [data]
  );


  const transactionCount =
    rowCount - expenseCount;


  const driverUSD =
    data?.driverSummary?.USD || {};

  const driverToman =
    data?.driverSummary?.TOMAN || {};

  const companyUSD =
    data?.companySummary?.USD || {};

  const companyToman =
    data?.companySummary?.TOMAN || {};


  return (
    <section>

      {/* ========================================
          کنترل‌های داخل برنامه
      ======================================== */}

      <div className="section-head no-print">

        <div>
          <h2>
            گزارش‌های مالی
          </h2>

          <p>
            گزارش تفکیکی حساب رانندگان و شرکت‌ها
          </p>
        </div>


        <div className="actions">

          {data && (
            <button
              onClick={printReport}
            >
              چاپ / PDF
            </button>
          )}

        </div>

      </div>


      <div className="panel no-print">

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
                رانندگان
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


      {/* ========================================
          خود گزارش
      ======================================== */}

      {data && (

        <div className="report-document">


          {/* ========================================
              سربرگ رسمی
          ======================================== */}

          <div className="report-header">

            <h1>
              شرکت حمل و نقل برادران والی
            </h1>

            <h2>
              گزارش مالی {reportTypeLabel()}
            </h2>

            <div className="report-info-line">

              <span>
                <b>از:</b>{' '}
                {from || 'ابتدای اطلاعات'}
              </span>

              <span>
                <b>تا:</b>{' '}
                {to || 'آخرین اطلاعات'}
              </span>

              <span>
                <b>تعداد عملیات:</b>{' '}
                {rowCount}
              </span>

              {entityType !== 'company' && (
                <span>
                  <b>تعداد رانندگان:</b>{' '}
                  {driverGroups.length}
                </span>
              )}

              {entityType !== 'driver' && (
                <span>
                  <b>تعداد شرکت‌ها:</b>{' '}
                  {companyGroups.length}
                </span>
              )}

              {entityType !== 'company' && (
                <span>
                  <b>تعداد هزینه‌ها:</b>{' '}
                  {expenseCount}
                </span>
              )}

              <span>
                <b>تراکنش‌های مالی:</b>{' '}
                {transactionCount}
              </span>

            </div>

          </div>


          {/* ========================================
              گزارش رانندگان
          ======================================== */}

          {driverGroups.length > 0 && (

            <div className="report-group-section">

              <h2>
                ریز حساب رانندگان
              </h2>


              {driverGroups.map(
                (group, index) => (

                  <div
                    className="report-account-card"
                    key={group.key}
                  >

                    <div className="report-account-head">

                      <div>
                        <b>
                          {index + 1}.
                          {' '}
                          راننده:
                        </b>
                        {' '}
                        {group.entityName}
                      </div>


                      <div>
                        <b>
                          پلاک:
                        </b>
                        {' '}
                        {group.plate || '—'}
                      </div>


                      <div>
                        <b>
                          تعداد عملیات:
                        </b>
                        {' '}
                        {group.rows.length}
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

                          <th>
                            ثبت‌کننده
                          </th>
                        </tr>
                      </thead>


                      <tbody>

                        {group.rows.map(
                          row => (

                            <tr key={row.id}>

                              <td>
                                {formatDate(
                                  row.occurredAt
                                )}
                              </td>

                              <td>
                                {typeLabel(
                                  row.type
                                )}
                              </td>

                              <td>
                                {row.description ||
                                  '—'}
                              </td>

                              <td>
                                {money(
                                  row.amount,
                                  row.currency
                                )}
                              </td>

                              <td>
                                {row.createdByName ||
                                  '—'}
                              </td>

                            </tr>

                          )
                        )}

                      </tbody>

                    </table>


                    <div className="report-account-summary">

                      <div className="report-summary-block">

                        <b>
                          خلاصه دلار
                        </b>

                        <span>
                          پرداخت:
                          {' '}
                          {money(
                            group.summary.USD.payment,
                            'USD'
                          )}
                        </span>

                        <span>
                          دریافت:
                          {' '}
                          {money(
                            group.summary.USD.receipt,
                            'USD'
                          )}
                        </span>

                        <span>
                          هزینه:
                          {' '}
                          {money(
                            group.summary.USD.expense,
                            'USD'
                          )}
                        </span>

                        <span>
                          بدهی:
                          {' '}
                          {money(
                            group.summary.USD.debt,
                            'USD'
                          )}
                        </span>

                        <strong>
                          مانده:
                          {' '}
                          {money(
                            group.summary.USD.balance,
                            'USD'
                          )}
                        </strong>

                      </div>


                      <div className="report-summary-block">

                        <b>
                          خلاصه تومان
                        </b>

                        <span>
                          پرداخت:
                          {' '}
                          {money(
                            group.summary.TOMAN.payment,
                            'TOMAN'
                          )}
                        </span>

                        <span>
                          دریافت:
                          {' '}
                          {money(
                            group.summary.TOMAN.receipt,
                            'TOMAN'
                          )}
                        </span>

                        <span>
                          هزینه:
                          {' '}
                          {money(
                            group.summary.TOMAN.expense,
                            'TOMAN'
                          )}
                        </span>

                        <span>
                          بدهی:
                          {' '}
                          {money(
                            group.summary.TOMAN.debt,
                            'TOMAN'
                          )}
                        </span>

                        <strong>
                          مانده:
                          {' '}
                          {money(
                            group.summary.TOMAN.balance,
                            'TOMAN'
                          )}
                        </strong>

                      </div>

                    </div>

                  </div>

                )
              )}

            </div>

          )}


          {/* ========================================
              گزارش شرکت‌ها
          ======================================== */}

          {companyGroups.length > 0 && (

            <div className="report-group-section">

              <h2>
                ریز حساب شرکت‌ها
              </h2>


              {companyGroups.map(
                (group, index) => (

                  <div
                    className="report-account-card"
                    key={group.key}
                  >

                    <div className="report-account-head">

                      <div>
                        <b>
                          {index + 1}.
                          {' '}
                          شرکت:
                        </b>
                        {' '}
                        {group.entityName}
                      </div>


                      <div>
                        <b>
                          تعداد عملیات:
                        </b>
                        {' '}
                        {group.rows.length}
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

                          <th>
                            ثبت‌کننده
                          </th>
                        </tr>
                      </thead>


                      <tbody>

                        {group.rows.map(
                          row => (

                            <tr key={row.id}>

                              <td>
                                {formatDate(
                                  row.occurredAt
                                )}
                              </td>

                              <td>
                                {typeLabel(
                                  row.type
                                )}
                              </td>

                              <td>
                                {row.description ||
                                  '—'}
                              </td>

                              <td>
                                {money(
                                  row.amount,
                                  row.currency
                                )}
                              </td>

                              <td>
                                {row.createdByName ||
                                  '—'}
                              </td>

                            </tr>

                          )
                        )}

                      </tbody>

                    </table>


                    <div className="report-account-summary">

                      <div className="report-summary-block">

                        <b>
                          خلاصه دلار
                        </b>

                        <span>
                          دریافت:
                          {' '}
                          {money(
                            group.summary.USD.receipt,
                            'USD'
                          )}
                        </span>

                        <span>
                          پرداخت:
                          {' '}
                          {money(
                            group.summary.USD.payment,
                            'USD'
                          )}
                        </span>

                        <span>
                          بدهی:
                          {' '}
                          {money(
                            group.summary.USD.debt,
                            'USD'
                          )}
                        </span>

                        <strong>
                          مانده:
                          {' '}
                          {money(
                            group.summary.USD.balance,
                            'USD'
                          )}
                        </strong>

                      </div>


                      <div className="report-summary-block">

                        <b>
                          خلاصه تومان
                        </b>

                        <span>
                          دریافت:
                          {' '}
                          {money(
                            group.summary.TOMAN.receipt,
                            'TOMAN'
                          )}
                        </span>

                        <span>
                          پرداخت:
                          {' '}
                          {money(
                            group.summary.TOMAN.payment,
                            'TOMAN'
                          )}
                        </span>

                        <span>
                          بدهی:
                          {' '}
                          {money(
                            group.summary.TOMAN.debt,
                            'TOMAN'
                          )}
                        </span>

                        <strong>
                          مانده:
                          {' '}
                          {money(
                            group.summary.TOMAN.balance,
                            'TOMAN'
                          )}
                        </strong>

                      </div>

                    </div>

                  </div>

                )
              )}

            </div>

          )}


          {/* ========================================
              جمع کل گزارش
          ======================================== */}

          <div className="report-total-section">

            <h2>
              جمع کل گزارش
            </h2>


            {data.driverSummary && (

              <div className="report-grand-total">

                <h3>
                  رانندگان
                </h3>


                <div className="report-account-summary">

                  <div className="report-summary-block">

                    <b>
                      دلار
                    </b>

                    <span>
                      پرداخت:
                      {' '}
                      {money(
                        driverUSD.payment,
                        'USD'
                      )}
                    </span>

                    <span>
                      دریافت:
                      {' '}
                      {money(
                        driverUSD.receipt,
                        'USD'
                      )}
                    </span>

                    <span>
                      هزینه:
                      {' '}
                      {money(
                        driverUSD.expense,
                        'USD'
                      )}
                    </span>

                    <span>
                      بدهی:
                      {' '}
                      {money(
                        driverUSD.debt,
                        'USD'
                      )}
                    </span>

                    <strong>
                      مانده:
                      {' '}
                      {money(
                        driverUSD.balance,
                        'USD'
                      )}
                    </strong>

                  </div>


                  <div className="report-summary-block">

                    <b>
                      تومان
                    </b>

                    <span>
                      پرداخت:
                      {' '}
                      {money(
                        driverToman.payment,
                        'TOMAN'
                      )}
                    </span>

                    <span>
                      دریافت:
                      {' '}
                      {money(
                        driverToman.receipt,
                        'TOMAN'
                      )}
                    </span>

                    <span>
                      هزینه:
                      {' '}
                      {money(
                        driverToman.expense,
                        'TOMAN'
                      )}
                    </span>

                    <span>
                      بدهی:
                      {' '}
                      {money(
                        driverToman.debt,
                        'TOMAN'
                      )}
                    </span>

                    <strong>
                      مانده:
                      {' '}
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

              <div className="report-grand-total">

                <h3>
                  شرکت‌ها
                </h3>


                <div className="report-account-summary">

                  <div className="report-summary-block">

                    <b>
                      دلار
                    </b>

                    <span>
                      دریافت:
                      {' '}
                      {money(
                        companyUSD.receipt,
                        'USD'
                      )}
                    </span>

                    <span>
                      پرداخت:
                      {' '}
                      {money(
                        companyUSD.payment,
                        'USD'
                      )}
                    </span>

                    <span>
                      بدهی:
                      {' '}
                      {money(
                        companyUSD.debt,
                        'USD'
                      )}
                    </span>

                    <strong>
                      مانده:
                      {' '}
                      {money(
                        companyUSD.balance,
                        'USD'
                      )}
                    </strong>

                  </div>


                  <div className="report-summary-block">

                    <b>
                      تومان
                    </b>

                    <span>
                      دریافت:
                      {' '}
                      {money(
                        companyToman.receipt,
                        'TOMAN'
                      )}
                    </span>

                    <span>
                      پرداخت:
                      {' '}
                      {money(
                        companyToman.payment,
                        'TOMAN'
                      )}
                    </span>

                    <span>
                      بدهی:
                      {' '}
                      {money(
                        companyToman.debt,
                        'TOMAN'
                      )}
                    </span>

                    <strong>
                      مانده:
                      {' '}
                      {money(
                        companyToman.balance,
                        'TOMAN'
                      )}
                    </strong>

                  </div>

                </div>

              </div>

            )}

          </div>


          {/* ========================================
              پایین گزارش
          ======================================== */}

          <div className="report-footer">

            <div>
              <b>
                VAHID VALI
              </b>

              <span>
                TEL: 09120801384
              </span>
            </div>


            <div>
              <b>
                HABIB VALI
              </b>

              <span>
                TEL: 09147257526
              </span>
            </div>


            <div>
              <b>
                امضا
              </b>
            </div>

          </div>


        </div>

      )}

    </section>
  );
}
