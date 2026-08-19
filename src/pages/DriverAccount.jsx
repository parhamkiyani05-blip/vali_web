import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSession, request } from '../lib/api';

export default function DriverAccount() {
  const { id } = useParams();
  const navigate = useNavigate();

  const role = getSession()?.user?.role;

  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    type: 'payment',
    amount: '',
    currency: 'TOMAN',
    description: ''
  });

  const [editForm, setEditForm] = useState({
    type: 'payment',
    amount: '',
    currency: 'TOMAN',
    description: ''
  });


  async function load() {
    try {
      setError('');

      const result = await request(
        `/api/drivers/${id}/account`
      );

      setData(result);

    } catch (err) {
      setError(
        err.message ||
        'خطا در دریافت حساب راننده'
      );
    }
  }


  useEffect(() => {
    load();
  }, [id]);


  async function submitTransaction(e) {
    e.preventDefault();

    if (busy) return;

    setMsg('');
    setBusy(true);

    try {
      const amount = Number(form.amount);

      if (!Number.isFinite(amount) || amount <= 0) {
        setMsg('مبلغ باید بیشتر از صفر باشد.');
        return;
      }

      await request('/api/transactions', {
        method: 'POST',
        body: JSON.stringify({
          entityType: 'driver',
          entityId: Number(id),
          type: form.type,
          amount,
          currency: form.currency,
          description: form.description
        })
      });

      setForm({
        type: 'payment',
        amount: '',
        currency: 'TOMAN',
        description: ''
      });

      setMsg('عملیات مالی با موفقیت ثبت شد.');

      await load();

    } catch (err) {
      setMsg(
        err.message ||
        'خطا در ثبت عملیات مالی'
      );

    } finally {
      setBusy(false);
    }
  }


  function startEdit(item) {
    if (role !== 'manager') return;

    setMsg('');
    setEditingId(item.id);

    setEditForm({
      type: item.type || 'payment',
      amount: String(item.amount ?? ''),
      currency: item.currency || 'TOMAN',
      description: item.description || ''
    });
  }


  function cancelEdit() {
    setEditingId(null);

    setEditForm({
      type: 'payment',
      amount: '',
      currency: 'TOMAN',
      description: ''
    });
  }


  async function saveEdit(transactionId) {
    if (
      role !== 'manager' ||
      busy
    ) {
      return;
    }

    setMsg('');
    setBusy(true);

    try {
      const amount = Number(editForm.amount);

      if (!Number.isFinite(amount) || amount <= 0) {
        setMsg('مبلغ باید بیشتر از صفر باشد.');
        return;
      }

      await request(
        `/api/transactions/${transactionId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            type: editForm.type,
            amount,
            currency: editForm.currency,
            description: editForm.description
          })
        }
      );

      setMsg('تراکنش با موفقیت ویرایش شد.');

      cancelEdit();

      await load();

    } catch (err) {
      setMsg(
        err.message ||
        'خطا در ویرایش تراکنش'
      );

    } finally {
      setBusy(false);
    }
  }


  async function deleteTransaction(transactionId) {
    if (role !== 'manager') return;

    const ok = confirm(
      'این تراکنش حذف شود؟ اطلاعات از دیتابیس پاک نمی‌شود و به بایگانی منتقل خواهد شد.'
    );

    if (!ok) return;

    setMsg('');

    try {
      await request(
        `/api/transactions/${transactionId}`,
        {
          method: 'DELETE'
        }
      );

      if (editingId === transactionId) {
        cancelEdit();
      }

      setMsg('تراکنش به بایگانی منتقل شد.');

      await load();

    } catch (err) {
      setMsg(
        err.message ||
        'خطا در حذف تراکنش'
      );
    }
  }


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

    const transactions =
      (data.transactions || []).map(item => ({
        ...item,
        source: 'transaction'
      }));

    const expenses =
      (data.expenses || []).map(item => ({
        ...item,
        type: 'expense',
        source: 'expense'
      }));

    return [
      ...transactions,
      ...expenses
    ].sort(
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
      currency === 'USD'
        ? '$'
        : 'تومان'
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
            onClick={() =>
              navigate('/drivers')
            }
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
          <h2>حساب راننده</h2>

          <p>
            {driver.name}
            {' - '}
            {driver.truck_number}
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
          شماره تماس:{' '}
          {driver.phone || '-'}
        </p>

      </div>


      <div className="panel">

        <div className="section-head">

          <div>
            <h3>
              ثبت عملیات مالی راننده
            </h3>

            <p>
              دریافت از راننده یا پرداخت به راننده
            </p>
          </div>

        </div>


        <form
          className="grid-form"
          onSubmit={submitTransaction}
        >

          <label>

            نوع عملیات

            <select
              value={form.type}
              onChange={e =>
                setForm({
                  ...form,
                  type: e.target.value
                })
              }
            >

              <option value="payment">
                پرداخت به راننده
              </option>

              <option value="receipt">
                دریافت از راننده
              </option>

            </select>

          </label>


          <label>

            مبلغ

            <input
              required
              type="number"
              min="0"
              step="any"
              value={form.amount}
              onChange={e =>
                setForm({
                  ...form,
                  amount: e.target.value
                })
              }
            />

          </label>


          <label>

            ارز

            <select
              value={form.currency}
              onChange={e =>
                setForm({
                  ...form,
                  currency: e.target.value
                })
              }
            >

              <option value="TOMAN">
                تومان
              </option>

              <option value="USD">
                دلار
              </option>

            </select>

          </label>


          <label className="wide">

            شرح

            <textarea
              value={form.description}
              onChange={e =>
                setForm({
                  ...form,
                  description: e.target.value
                })
              }
              placeholder="شرح عملیات را بنویسید"
            />

          </label>


          <button disabled={busy}>
            {busy
              ? 'در حال ثبت...'
              : 'ثبت عملیات'}
          </button>

        </form>


        {msg && (
          <div className="notice">
            {msg}
          </div>
        )}

      </div>


      <div className="panel">

        <h3>
          حساب دلار
        </h3>

        <div className="dashboard-grid">

          <div>
            <small>
              پرداخت به راننده
            </small>

            <strong>
              {money(
                summary.USD.payment,
                'USD'
              )}
            </strong>
          </div>


          <div>
            <small>
              دریافت از راننده
            </small>

            <strong>
              {money(
                summary.USD.receipt,
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
                summary.USD.expense,
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
                summary.USD.balance,
                'USD'
              )}
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
              پرداخت به راننده
            </small>

            <strong>
              {money(
                summary.TOMAN.payment,
                'TOMAN'
              )}
            </strong>
          </div>


          <div>
            <small>
              دریافت از راننده
            </small>

            <strong>
              {money(
                summary.TOMAN.receipt,
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
                summary.TOMAN.expense,
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
                summary.TOMAN.balance,
                'TOMAN'
              )}
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
              <th>تاریخ</th>
              <th>نوع</th>
              <th>شرح</th>
              <th>مبلغ</th>

              {role === 'manager' && (
                <th>عملیات</th>
              )}
            </tr>

          </thead>


          <tbody>

            {rows.map(item => {

              const isEditing =
                item.source === 'transaction' &&
                editingId === item.id;

              return (

                <tr
                  key={`${item.source}-${item.id}`}
                >

                  <td>
                    {item.occurred_at
                      ? new Date(
                          item.occurred_at
                        ).toLocaleString('fa-IR')
                      : '-'}
                  </td>


                  <td>

                    {isEditing ? (

                      <select
                        value={editForm.type}
                        onChange={e =>
                          setEditForm({
                            ...editForm,
                            type: e.target.value
                          })
                        }
                      >

                        <option value="payment">
                          پرداخت
                        </option>

                        <option value="receipt">
                          دریافت
                        </option>

                        <option value="debt">
                          بدهی
                        </option>

                      </select>

                    ) : (

                      typeLabel(item.type)

                    )}

                  </td>


                  <td>

                    {isEditing ? (

                      <input
                        value={editForm.description}
                        onChange={e =>
                          setEditForm({
                            ...editForm,
                            description: e.target.value
                          })
                        }
                      />

                    ) : (

                      item.description || '-'

                    )}

                  </td>


                  <td>

                    {isEditing ? (

                      <div className="actions">

                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={editForm.amount}
                          onChange={e =>
                            setEditForm({
                              ...editForm,
                              amount: e.target.value
                            })
                          }
                        />

                        <select
                          value={editForm.currency}
                          onChange={e =>
                            setEditForm({
                              ...editForm,
                              currency: e.target.value
                            })
                          }
                        >

                          <option value="TOMAN">
                            تومان
                          </option>

                          <option value="USD">
                            دلار
                          </option>

                        </select>

                      </div>

                    ) : (

                      money(
                        item.amount,
                        item.currency
                      )

                    )}

                  </td>


                  {role === 'manager' && (

                    <td>

                      {item.source === 'transaction' ? (

                        isEditing ? (

                          <div className="actions">

                            <button
                              onClick={() =>
                                saveEdit(item.id)
                              }
                              disabled={busy}
                            >
                              ذخیره
                            </button>

                            <button
                              className="ghost"
                              onClick={cancelEdit}
                              disabled={busy}
                            >
                              انصراف
                            </button>

                          </div>

                        ) : (

                          <div className="actions">

                            <button
                              className="ghost"
                              onClick={() =>
                                startEdit(item)
                              }
                            >
                              ویرایش
                            </button>

                            <button
                              className="ghost danger"
                              onClick={() =>
                                deleteTransaction(
                                  item.id
                                )
                              }
                            >
                              حذف
                            </button>

                          </div>

                        )

                      ) : (

                        <span>
                          هزینه
                        </span>

                      )}

                    </td>

                  )}

                </tr>

              );

            })}


            {!rows.length && (

              <tr>

                <td
                  colSpan={
                    role === 'manager'
                      ? '5'
                      : '4'
                  }
                >
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
