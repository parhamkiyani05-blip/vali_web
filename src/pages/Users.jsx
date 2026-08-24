import { useEffect, useState } from 'react';
import { request } from '../lib/api';

export default function Users() {
  const [items, setItems] = useState([]);

  const [f, setF] = useState({
    username: '',
    fullName: '',
    role: 'employee',
    password: ''
  });

  const [editing, setEditing] = useState(null);

  const [editForm, setEditForm] = useState({
    username: '',
    fullName: '',
    role: 'employee',
    password: ''
  });

  const [msg, setMsg] = useState('');

  async function load() {
    try {
      const data = await request('/api/users');
      setItems(data);
    } catch (error) {
      setMsg(error.message || 'خطا در دریافت کاربران');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function add(e) {
    e.preventDefault();
    setMsg('');

    try {
      await request('/api/users', {
        method: 'POST',
        body: JSON.stringify(f)
      });

      setF({
        username: '',
        fullName: '',
        role: 'employee',
        password: ''
      });

      setMsg('حساب کاربری با موفقیت ساخته شد.');

      await load();
    } catch (error) {
      if (error.message === 'USERNAME_EXISTS') {
        setMsg('این نام کاربری قبلاً استفاده شده است.');
        return;
      }

      setMsg(error.message || 'خطا در ساخت حساب');
    }
  }

  async function toggle(x) {
    setMsg('');

    try {
      await request(`/api/users/${x.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          active: !x.active
        })
      });

      setMsg(
        x.active
          ? 'کاربر غیرفعال شد.'
          : 'کاربر فعال شد.'
      );

      await load();
    } catch (error) {
      setMsg(error.message || 'خطا در تغییر وضعیت کاربر');
    }
  }

  function startEdit(x) {
    setEditing(x.id);

    setEditForm({
      username: x.username || '',
      fullName: x.full_name || '',
      role: x.role || 'employee',
      password: ''
    });

    setMsg('');
  }

  function cancelEdit() {
    setEditing(null);

    setEditForm({
      username: '',
      fullName: '',
      role: 'employee',
      password: ''
    });
  }

  async function saveEdit(e) {
    e.preventDefault();

    if (!editing) return;

    setMsg('');

    try {
      const payload = {
        username: editForm.username,
        fullName: editForm.fullName,
        role: editForm.role
      };

      // اگر رمز خالی باشد، رمز قبلی تغییر نمی‌کند
      if (editForm.password.trim()) {
        payload.password = editForm.password;
      }

      await request(`/api/users/${editing}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });

      setMsg('اطلاعات کاربر با موفقیت ویرایش شد.');

      cancelEdit();

      await load();
    } catch (error) {
      if (error.message === 'USERNAME_EXISTS') {
        setMsg('این نام کاربری قبلاً استفاده شده است.');
        return;
      }

      setMsg(error.message || 'خطا در ویرایش کاربر');
    }
  }

  return (
    <section>

      <div className="section-head">
        <div>
          <h2>کارمندان</h2>

          <p>
            فقط مدیر می‌تواند حساب کاربری بسازد،
            نام کاربری یا رمز عبور را تغییر دهد
            و کاربران را فعال یا غیرفعال کند.
          </p>
        </div>
      </div>


      <div className="panel">

        <form
          className="grid-form"
          onSubmit={add}
        >

          <label>
            نام کاربری

            <input
              required
              value={f.username}
              onChange={e =>
                setF({
                  ...f,
                  username: e.target.value
                })
              }
            />
          </label>


          <label>
            نام کارمند

            <input
              required
              value={f.fullName}
              onChange={e =>
                setF({
                  ...f,
                  fullName: e.target.value
                })
              }
            />
          </label>


          <label>
            نقش

            <select
              value={f.role}
              onChange={e =>
                setF({
                  ...f,
                  role: e.target.value
                })
              }
            >
              <option value="manager">
                مدیر
              </option>

              <option value="office">
                دفتردار
              </option>

              <option value="employee">
                کارمند
              </option>
            </select>
          </label>


          <label>
            رمز عبور

            <input
              required
              type="password"
              value={f.password}
              onChange={e =>
                setF({
                  ...f,
                  password: e.target.value
                })
              }
            />
          </label>


          <button>
            ساخت حساب
          </button>

        </form>


        {msg && (
          <div className="notice">
            {msg}
          </div>
        )}

      </div>


      {editing && (

        <div className="panel">

          <div className="section-head">
            <div>
              <h3>
                ویرایش حساب کاربری
              </h3>

              <p>
                در صورت خالی گذاشتن رمز عبور،
                رمز فعلی کاربر تغییر نمی‌کند.
              </p>
            </div>
          </div>


          <form
            className="grid-form"
            onSubmit={saveEdit}
          >

            <label>
              نام کاربری

              <input
                required
                value={editForm.username}
                onChange={e =>
                  setEditForm({
                    ...editForm,
                    username: e.target.value
                  })
                }
              />
            </label>


            <label>
              نام کارمند

              <input
                required
                value={editForm.fullName}
                onChange={e =>
                  setEditForm({
                    ...editForm,
                    fullName: e.target.value
                  })
                }
              />
            </label>


            <label>
              نقش

              <select
                value={editForm.role}
                onChange={e =>
                  setEditForm({
                    ...editForm,
                    role: e.target.value
                  })
                }
              >
                <option value="manager">
                  مدیر
                </option>

                <option value="office">
                  دفتردار
                </option>

                <option value="employee">
                  کارمند
                </option>
              </select>
            </label>


            <label>
              رمز عبور جدید

              <input
                type="password"
                placeholder="در صورت نیاز وارد کنید"
                value={editForm.password}
                onChange={e =>
                  setEditForm({
                    ...editForm,
                    password: e.target.value
                  })
                }
              />
            </label>


            <button>
              ذخیره تغییرات
            </button>


            <button
              type="button"
              className="ghost"
              onClick={cancelEdit}
            >
              انصراف
            </button>

          </form>

        </div>

      )}


      <div className="panel">

        <table>

          <thead>

            <tr>
              <th>نام</th>
              <th>نام کاربری</th>
              <th>نقش</th>
              <th>وضعیت</th>
              <th>عملیات</th>
            </tr>

          </thead>


          <tbody>

            {items.map(x => (

              <tr key={x.id}>

                <td>
                  {x.full_name}
                </td>

                <td>
                  {x.username}
                </td>

                <td>
                  {x.role === 'manager'
                    ? 'مدیر'
                    : x.role === 'office'
                    ? 'دفتردار'
                    : 'کارمند'
                  }
                </td>

                <td>
                  {x.active
                    ? 'فعال'
                    : 'غیرفعال'
                  }
                </td>

                <td>

                  <div className="actions">

                    <button
                      className="ghost"
                      onClick={() =>
                        startEdit(x)
                      }
                    >
                      ویرایش
                    </button>


                    <button
                      className="ghost"
                      onClick={() =>
                        toggle(x)
                      }
                    >
                      {x.active
                        ? 'غیرفعال'
                        : 'فعال'
                      }
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
