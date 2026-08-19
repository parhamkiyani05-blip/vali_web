import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSession, request } from '../lib/api';

export default function Drivers() {
  const role = getSession()?.user?.role;
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState('');

  const [form, setForm] = useState({
    name: '',
    truckNumber: '',
    phone: '',
    language: 'fa'
  });

  async function load() {
    if (role === 'employee') {
      return;
    }

    try {
      const data = await request('/api/drivers');
      setItems(data);
    } catch (error) {
      setMsg(error.message || 'خطا در دریافت لیست راننده‌ها');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function add(e) {
    e.preventDefault();

    setMsg('');

    try {
      await request('/api/drivers', {
        method: 'POST',
        body: JSON.stringify(form)
      });

      setForm({
        name: '',
        truckNumber: '',
        phone: '',
        language: 'fa'
      });

      setMsg(
        role === 'employee'
          ? 'راننده و پلاک با موفقیت ثبت شد.'
          : 'راننده با موفقیت ثبت شد.'
      );

      if (role !== 'employee') {
        await load();
      }

    } catch (error) {
      if (error.message === 'PLATE_ALREADY_EXISTS') {
        setMsg('این شماره پلاک قبلاً در سیستم ثبت شده است.');
      } else {
        setMsg(error.message || 'خطا در ثبت راننده');
      }
    }
  }

  async function archiveDriver(id) {
    if (!confirm('این راننده به بایگانی منتقل شود؟')) {
      return;
    }

    try {
      await request(`/api/drivers/${id}`, {
        method: 'DELETE'
      });

      setMsg('راننده به بایگانی منتقل شد.');

      await load();

    } catch (error) {
      setMsg(error.message || 'خطا در بایگانی راننده');
    }
  }

  return (
    <section>

      <div className="section-head">
        <div>
          <h2>
            {role === 'employee'
              ? 'ثبت راننده و پلاک'
              : 'راننده‌ها'}
          </h2>

          <p>
            {role === 'employee'
              ? 'راننده و شماره پلاک جدید را ثبت کنید.'
              : 'ثبت راننده، شماره پلاک، تماس و مشاهده حساب راننده‌ها.'}
          </p>
        </div>
      </div>


      <div className="panel">

        <form
          className="grid-form"
          onSubmit={add}
        >

          <label>
            نام راننده

            <input
              required
              value={form.name}
              onChange={e =>
                setForm({
                  ...form,
                  name: e.target.value
                })
              }
            />
          </label>


          <label>
            شماره کامیون / پلاک

            <input
              required
              value={form.truckNumber}
              onChange={e =>
                setForm({
                  ...form,
                  truckNumber: e.target.value.toUpperCase()
                })
              }
            />
          </label>


          <label>
            شماره تماس

            <input
              required
              value={form.phone}
              onChange={e =>
                setForm({
                  ...form,
                  phone: e.target.value
                })
              }
            />
          </label>


          <label>
            زبان

            <select
              value={form.language}
              onChange={e =>
                setForm({
                  ...form,
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


          <button>
            افزودن راننده
          </button>

        </form>


        {msg && (
          <div className="notice">
            {msg}
          </div>
        )}

      </div>


      {role !== 'employee' && (
        <div className="panel">

          <table>

            <thead>
              <tr>
                <th>راننده</th>
                <th>پلاک</th>
                <th>تماس</th>
                <th>زبان</th>
                <th>عملیات</th>
              </tr>
            </thead>


            <tbody>

              {items.map(driver => (
                <tr key={driver.id}>

                  <td>
                    {driver.name}
                  </td>

                  <td>
                    {driver.truck_number}
                  </td>

                  <td>
                    {driver.phone}
                  </td>

                  <td>
                    {driver.language === 'tr'
                      ? 'Türkçe'
                      : 'فارسی'}
                  </td>

                  <td>
                    <div className="actions">

                      <button
                        onClick={() =>
                          navigate(`/drivers/${driver.id}/account`)
                        }
                      >
                        حساب
                      </button>

                      {role === 'manager' && (
                        <button
                          className="ghost danger"
                          onClick={() =>
                            archiveDriver(driver.id)
                          }
                        >
                          بایگانی
                        </button>
                      )}

                    </div>
                  </td>

                </tr>
              ))}


              {!items.length && (
                <tr>
                  <td colSpan="5">
                    هنوز راننده‌ای ثبت نشده است.
                  </td>
                </tr>
              )}

            </tbody>

          </table>

        </div>
      )}

    </section>
  );
}
