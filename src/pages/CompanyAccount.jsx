import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getSession, request } from '../lib/api';

export default function CompanyAccount() {
  const { id } = useParams();
  const navigate = useNavigate();

  const role = getSession()?.user?.role;

  const [data, setData] = useState(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    type: 'receipt',
    amount: '',
    currency: 'TOMAN',
    description: ''
  });

  const [editForm, setEditForm] = useState({
    type: 'receipt',
    amount: '',
    currency: 'TOMAN',
    description: ''
  });


  async function load() {
    try {
      const result = await request(
        `/api/companies/${id}/account`
      );

      setData(result);

    } catch (error) {
      setMsg(
        error.message ||
        'خطا در دریافت حساب شرکت'
      );
    }
  }


  useEffect(() => {
    load();
  }, [id]);


  async function submit(e) {
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
          entityType: 'company',
          entityId: Number(id),
          type: form.type,
          amount,
          currency: form.currency,
          description: form.description
        })
      });

      setForm({
        type: 'receipt',
        amount: '',
        currency: 'TOMAN',
        description: ''
      });

      setMsg('عملیات مالی ثبت شد.');

      await load();

    } catch (error) {
      setMsg(
        error.message ||
        'خطا در ثبت عملیات'
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
      type: item.type || 'receipt',
      amount: String(item.amount ?? ''),
      currency: item.currency || 'TOMAN',
      description: item.description || ''
    });
  }


  function cancelEdit() {
    setEditingId(null);

    setEditForm({
      type: 'receipt',
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

      setMsg(
        'تراکنش با موفقیت ویرایش شد.'
      );

      cancelEdit();

      await load();

    } catch (error) {
      setMsg(
        error.message ||
        'خطا در ویرایش تراکنش'
      );

    } finally {
      setBusy(false);
    }
  }


  async function removeTransaction(transactionId) {
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

      setMsg(
        'تراکنش به بایگانی منتقل شد.'
      );

      await load();

    } catch (error) {
      setMsg(
        error.message ||
        'خطا در حذف تراکنش'
      );
    }
  }


  const summary = useMemo(() => {
    const result = {
      USD: {
        receipt: 0,
        payment: 0,
        debt: 0,
        balance: 0
      },

      TOMAN: {
        receipt: 0,
        payment: 0,
        debt: 0,
        balance: 0
      }
    };

    for (
      const item of
      data?.transactions || []
    ) {
      if (!result[item.currency]) {
        continue;
      }

      const amount =
        Number(item.amount || 0);

      if (item.type === 'receipt') {
        result[item.currency].receipt +=
          amount;
      }

      if (item.type === 'payment') {
        result[item.currency].payment +=
          amount;
      }

      if (item.type === 'debt') {
        result[item.currency].debt +=
          amount;
      }
    }

    for (
      const currency of
      ['USD', 'TOMAN']
    ) {
      result[currency].balance =
        result[currency].receipt -
        result[currency].payment -
        result[currency].debt;
    }

    return result;

  }, [data]);


  function money(value, currency) {
    return `${Number(value || 0).toLocaleString()} ${
      currency === 'USD'
        ? '$'
        : 'تومان'
    }`;
  }


  function typeLabel(type) {
    if (type === 'receipt') {
      return 'دریافت';
    }

    if (type === 'payment') {
      return 'پرداخت';
    }

    if (type === 'debt') {
      return 'بدهی';
    }

    return type;
  }


  if (!data) {
    return (
      <section>

        <div className="panel">
          {msg ||
            'در حال دریافت حساب شرکت...'}
        </div>

      </section>
    );
  }


  return (
    <section>


      <div className="section-head">

        <div>

          <h2>
            حساب شرکت
          </h2>

          <p>
            {data.company.name}
          </p>

        </div>


        <div className="actions">

          <button
            className="ghost"
            onClick={() =>
              navigate('/companies')
            }
          >
            بازگشت
          </button>


          <button
            onClick={() =>
              navigate(
                `/invoice/company/${id}`
              )
            }
          >
            فاکتور
          </button>

        </div>

      </div>



      <div className="panel">

        <h3>
          {data.company.name}
        </h3>

        <p>
          تماس:{' '}
          {data.company.phone || '—'}
        </p>

        {data.company.note && (
          <p>
            یادداشت:{' '}
            {data.company.note}
          </p>
        )}

      </div>



      <div className="panel">

        <h3>
          ثبت عملیات مالی
        </h3>


        <form
          className="grid-form"
          onSubmit={submit}
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

              <option value="receipt">
                دریافت
              </option>

              <option value="payment">
                پرداخت
              </option>

              <option value="debt">
                بدهی
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
                  description:
                    e.target.value
                })
              }
              placeholder="شرح عملیات را بنویسید"
            />

          </label>


          <button
            disabled={busy}
          >
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
              دریافت
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
              پرداخت
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
              بدهی
            </small>

            <strong>
              {money(
                summary.USD.debt,
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
              دریافت
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
              پرداخت
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
              بدهی
            </small>

            <strong>
              {money(
                summary.TOMAN.debt,
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

        <h3>
          ریز تراکنش‌ها
        </h3>


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

              {role === 'manager' && (
                <th>
                  عملیات
                </th>
              )}

            </tr>

          </thead>


          <tbody>

            {(data.transactions || []).map(
              item => {

                const isEditing =
                  editingId === item.id;

                return (

                  <tr key={item.id}>

                    <td>

                      {item.occurred_at
                        ? new Date(
                            item.occurred_at
                          ).toLocaleString(
                            'fa-IR'
                          )
                        : '—'}

                    </td>


                    <td>

                      {isEditing ? (

                        <select
                          value={
                            editForm.type
                          }
                          onChange={e =>
                            setEditForm({
                              ...editForm,
                              type:
                                e.target.value
                            })
                          }
                        >

                          <option value="receipt">
                            دریافت
                          </option>

                          <option value="payment">
                            پرداخت
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
                          value={
                            editForm.description
                          }
                          onChange={e =>
                            setEditForm({
                              ...editForm,
                              description:
                                e.target.value
                            })
                          }
                        />

                      ) : (

                        item.description || '—'

                      )}

                    </td>


                    <td>

                      {isEditing ? (

                        <div className="actions">

                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={
                              editForm.amount
                            }
                            onChange={e =>
                              setEditForm({
                                ...editForm,
                                amount:
                                  e.target.value
                              })
                            }
                          />


                          <select
                            value={
                              editForm.currency
                            }
                            onChange={e =>
                              setEditForm({
                                ...editForm,
                                currency:
                                  e.target.value
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

                        {isEditing ? (

                          <div className="actions">

                            <button
                              onClick={() =>
                                saveEdit(
                                  item.id
                                )
                              }
                              disabled={busy}
                            >
                              ذخیره
                            </button>


                            <button
                              className="ghost"
                              onClick={
                                cancelEdit
                              }
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
                                startEdit(
                                  item
                                )
                              }
                            >
                              ویرایش
                            </button>


                            <button
                              className="ghost danger"
                              onClick={() =>
                                removeTransaction(
                                  item.id
                                )
                              }
                            >
                              حذف
                            </button>

                          </div>

                        )}

                      </td>

                    )}

                  </tr>

                );

              }
            )}


            {!data.transactions?.length && (

              <tr>

                <td
                  colSpan={
                    role === 'manager'
                      ? '5'
                      : '4'
                  }
                >
                  هنوز تراکنشی برای این شرکت ثبت نشده است.
                </td>

              </tr>

            )}

          </tbody>

        </table>

      </div>


    </section>
  );
}
