import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSession, request } from '../lib/api';

export default function Drivers(){

  const role = getSession()?.user?.role;
  const navigate = useNavigate();

  const [items,setItems] = useState([]);

  const [f,setF] = useState({
    name:'',
    truckNumber:'',
    phone:'',
    language:'fa'
  });

  const [msg,setMsg] = useState('');


  async function load(){
    try{
      setItems(await request('/api/drivers'));
    }catch(error){
      setMsg(error.message || 'خطا در دریافت راننده‌ها');
    }
  }


  useEffect(()=>{
    load();
  },[]);


  async function add(e){

    e.preventDefault();

    setMsg('');

    try{

      await request('/api/drivers',{
        method:'POST',
        body:JSON.stringify(f)
      });

      setF({
        name:'',
        truckNumber:'',
        phone:'',
        language:'fa'
      });

      setMsg('راننده با موفقیت ثبت شد.');

      load();

    }catch(error){

      if(error.message === 'PLATE_ALREADY_EXISTS'){
        setMsg('این شماره پلاک قبلاً در سیستم ثبت شده است.');
      }
      else{
        setMsg(error.message || 'خطا در ثبت راننده');
      }

    }

  }


  async function del(id){

    if(!confirm('این راننده به بایگانی منتقل شود؟')){
      return;
    }

    try{

      await request(`/api/drivers/${id}`,{
        method:'DELETE'
      });

      load();

    }catch(error){

      setMsg(error.message || 'خطا در بایگانی راننده');

    }

  }


  return (

    <section>

      <div className="section-head">

        <div>

          <h2>راننده‌ها</h2>

          <p>
            ثبت راننده، شماره پلاک، تماس و مشاهده حساب راننده
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
              value={f.name}
              onChange={e=>
                setF({
                  ...f,
                  name:e.target.value
                })
              }
            />

          </label>


          <label>

            شماره کامیون / پلاک

            <input
              required
              value={f.truckNumber}
              onChange={e=>
                setF({
                  ...f,
                  truckNumber:e.target.value.toUpperCase()
                })
              }
            />

          </label>


          <label>

            شماره تماس

            <input
              required
              value={f.phone}
              onChange={e=>
                setF({
                  ...f,
                  phone:e.target.value
                })
              }
            />

          </label>


          <label>

            زبان

            <select
              value={f.language}
              onChange={e=>
                setF({
                  ...f,
                  language:e.target.value
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

            {items.map(x=>(

              <tr key={x.id}>

                <td>
                  {x.name}
                </td>

                <td>
                  {x.truck_number}
                </td>

                <td>
                  {x.phone}
                </td>

                <td>
                  {x.language === 'tr'
                    ? 'Türkçe'
                    : 'فارسی'
                  }
                </td>

                <td>

                  <div className="actions">

                    <button
                      onClick={()=>
                        navigate(`/drivers/${x.id}/account`)
                      }
                    >
                      حساب
                    </button>


                    {role === 'manager' && (

                      <button
                        className="ghost danger"
                        onClick={()=>del(x.id)}
                      >
                        بایگانی
                      </button>

                    )}

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
