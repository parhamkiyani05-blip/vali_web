import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { request } from '../lib/api';

export default function Companies() {

  const navigate = useNavigate();

  const [items, setItems] = useState([]);

  const [f, setF] = useState({
    name: '',
    phone: '',
    language: 'fa',
    note: ''
  });

  const [msg, setMsg] = useState('');


  async function load() {
    try {
      setItems(await request('/api/companies'));
    } catch (error) {
      setMsg(error.message || 'خطا در دریافت شرکت‌ها');
    }
  }


  useEffect(() => {
    load();
  }, []);


  async function add(e) {

    e.preventDefault();
    setMsg('');

    try {

      await request('/api/companies', {
        method: 'POST',
        body: JSON.stringify(f)
      });

      setF({
        name: '',
        phone: '',
        language: 'fa',
        note: ''
      });

      setMsg('شرکت با موفقیت ثبت شد.');

      load();

    } catch (error) {

      setMsg(error.message || 'خطا در ثبت شرکت');

    }

  }


  async function removeCompany(id) {

    if (!confirm('این شرکت به بایگانی منتقل شود؟')) {
      return;
    }

    try {

      await request(`/api/companies/${id}`, {
        method: 'DELETE'
      });

      setMsg('شرکت به بایگانی منتقل شد.');

      load();

    } catch (error) {

      setMsg(error.message || 'خطا در بایگانی شرکت');

    }

  }


  return (

    <section>

      <div className="section-head">

        <div>

          <h2>حساب شرکت‌ها</h2>

          <p>
            حساب شرکت‌ها فقط برای مدیر قابل مشاهده است.
            دلار و تومان مستقل محاسبه می‌شوند.
          </p>

        </div>

      </div>


      <div className="panel">

        <form
          className="grid-form"
          onSubmit={add}
        >

          <label>

            نام شرکت

            <input
              required
              value={f.name}
              onChange={e =>
                setF({
                  ...f,
                  name: e.target.value
                })
              }
            />

          </label>


          <label>

            شماره تماس

            <input
              value={f.phone}
              onChange={e =>
                setF({
                  ...f,
                  phone: e.target.value
                })
              }
            />

          </label>


          <label>

            زبان فاکتور

            <select
              value={f.language}
              onChange={e =>
                setF({
                  ...f,
                  language: e.target.value
                })
              }
            >

              <option value="fa">
                فارسی
              </option>

              <option value="tr">
                Türkçe
              </option>

            </select>

          </label>


          <label className="wide">

            یادداشت

            <textarea
              value={f.note}
              onChange={e =>
                setF({
                  ...f,
                  note: e.target.value
                })
              }
            />

          </label>


          <button>
            افزودن شرکت
          </button>

        </form>


        {msg && (
          <div className="notice">
            {msg}
          </div>
        )}

      </div>


      <div className="panel">

        <table>

          <thead>

            <tr>

              <th>شرکت</th>

              <th>تماس</th>

              <th>زبان</th>

              <th>عملیات</th>

            </tr>

          </thead>


          <tbody>

            {items.map(company => (

              <tr key={company.id}>

                <td>
                  {company.name}
                </td>

                <td>
                  {company.phone || '—'}
                </td>

                <td>
                  {company.language === 'tr'
                    ? 'Türkçe'
                    : 'فارسی'
                  }
                </td>

                <td>

                  <div className="actions">

                    <button
                      onClick={() =>
                        navigate(`/companies/${company.id}/account`)
                      }
                    >
                      حساب
                    </button>


                    <button
                      className="ghost"
                      onClick={() =>
                        navigate(`/invoice/company/${company.id}`)
                      }
                    >
                      فاکتور
                    </button>


                    <button
                      className="ghost danger"
                      onClick={() =>
                        removeCompany(company.id)
                      }
                    >
                      بایگانی
                    </button>

                  </div>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </section>

  );

}
