import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { request } from '../lib/api';

export default function CompanyAccount() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({
    type: 'receipt',
    amount: '',
    currency: 'TOMAN',
    description: ''
  });

  async function load() {
    try {
      setData(await request(`/api/companies/${id}/account`));
    } catch (error) {
      setMsg(error.message || 'خطا در دریافت حساب شرکت');
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function submit(e) {
    e.preventDefault();
    setMsg('');

    try {
      await request('/api/transactions', {
        method: 'POST',
        body: JSON.stringify({
          entityType: 'company',
          entityId: Number(id),
          type: form.type,
          amount: Number(form.amount),
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
      load();

    } catch (error) {
      setMsg(error.message || 'خطا در ثبت عملیات');
    }
  }

  async function removeTransaction(transactionId) {
    if (!confirm('این تراکنش به بایگانی منتقل شود؟')) return;

    try {
      await request(`/api/transactions/${transactionId}`, {
        method: 'DELETE'
      });

      load();
    } catch (error) {
      setMsg(error.message || 'خطا در حذف تراکنش');
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

    for (const item of data?.transactions || []) {
      if (!result[item.currency]) continue;

      const amount = Number(item.amount || 0);

      if (item.type === 'receipt') {
        result[item.currency].receipt += amount;
      }

      if (item.type === 'payment') {
        result[item.currency].payment += amount;
      }

      if (item.type === 'debt') {
        result[item.currency].debt += amount;
      }
    }

    for (const currency of ['USD', 'TOMAN']) {
      result[currency].balance =
        result[currency].receipt -
        result[currency].payment -
        result[currency].debt;
    }

    return result;
  }, [data]);

  function money(value, currency) {
    return `${Number(value || 0).toLocaleString()} ${
      currency === 'USD' ? '$' : 'تومان'
    }`;
  }

  function typeLabel(type) {
    if (type === 'receipt') return 'دریافت';
    if (type === 'payment') return 'پرداخت';
    if (type === 'debt') return 'بدهی';
    return type;
  }

  if (!data) {
    return (
      <section>
        <div className="panel">
          {msg || 'در حال دریافت حساب شرکت...'}
        </div>
      </section>
    );
  }

  return (
    <section>

      <div className="section-head">
        <div>
          <h2>حساب شرکت</h2>
          <p>{data.company.name}</p>
        </div>

        <div className="actions">
          <button
            className="ghost"
            onClick={() => navigate('/companies')}
          >
            بازگشت
          </button>

          <button
            onClick={() => navigate(`/invoice/company/${id}`)}
          >
            فاکتور
          </button>
        </div>
      </div>


      <div className="panel">
        <h3>{data.company.name}</h3>

        <p>
          تماس: {data.company.phone || '—'}
        </p>

        {data.company.note && (
          <p>
            یادداشت: {data.company.note}
          </p>
        )}
      </div>


      <div className="panel">

        <h3>ثبت عملیات مالی</h3>

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
            />
          </label>


          <button>
            ثبت عملیات
          </button>

        </form>

        {msg && (
          <div className="notice">
            {msg}
          </div>
        )}

      </div>


      <div className="panel">
        <h3>حساب دلار</h3>

        <div className="dashboard-grid">

          <div>
            <small>دریافت</small>
            <strong>{money(summary.USD.receipt, 'USD')}</strong>
          </div>

          <div>
            <small>پرداخت</small>
            <strong>{money(summary.USD.payment, 'USD')}</strong>
          </div>

          <div>
            <small>بدهی</small>
            <strong>{money(summary.USD.debt, 'USD')}</strong>
          </div>

          <div>
            <small>مانده</small>
            <strong>{money(summary.USD.balance, 'USD')}</strong>
          </div>

        </div>
      </div>


      <div className="panel">
        <h3>حساب تومان</h3>

        <div className="dashboard-grid">

          <div>
            <small>دریافت</small>
            <strong>{money(summary.TOMAN.receipt, 'TOMAN')}</strong>
          </div>

          <div>
            <small>پرداخت</small>
            <strong>{money(summary.TOMAN.payment, 'TOMAN')}</strong>
          </div>

          <div>
            <small>بدهی</small>
            <strong>{money(summary.TOMAN.debt, 'TOMAN')}</strong>
          </div>

          <div>
            <small>مانده</small>
            <strong>{money(summary.TOMAN.balance, 'TOMAN')}</strong>
          </div>

        </div>
      </div>


      <div className="panel">

        <h3>ریز تراکنش‌ها</h3>

        <table>

          <thead>
            <tr>
              <th>تاریخ</th>
              <th>نوع</th>
              <th>شرح</th>
              <th>مبلغ</th>
              <th>عملیات</th>
            </tr>
          </thead>

          <tbody>

            {(data.transactions || []).map(item => (

              <tr key={item.id}>

                <td>
                  {new Date(item.occurred_at).toLocaleString('fa-IR')}
                </td>

                <td>
                  {typeLabel(item.type)}
                </td>

                <td>
                  {item.description || '—'}
                </td>

                <td>
                  {money(item.amount, item.currency)}
                </td>

                <td>
                  <button
                    className="ghost danger"
                    onClick={() => removeTransaction(item.id)}
                  >
                    حذف
                  </button>
                </td>

              </tr>

            ))}

            {!data.transactions?.length && (
              <tr>
                <td colSpan="5">
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
