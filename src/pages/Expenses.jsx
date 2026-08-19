import { useEffect, useState } from 'react';
import { getSession, queueExpense, request } from '../lib/api';

export default function Expenses(){

  const role = getSession()?.user?.role;

  const [items,setItems] = useState([]);
  const [drivers,setDrivers] = useState([]);
  const [search,setSearch] = useState('');
  const [selectedDriver,setSelectedDriver] = useState(null);

  const [form,setForm] = useState({
    amount:'',
    currency:'TOMAN',
    description:''
  });

  const [msg,setMsg] = useState('');


  async function load(){
    if(role==='employee') return;

    try{
      setItems(await request('/api/expenses'));
    }catch{}
  }


  useEffect(()=>{
    load();
  },[]);



  // جستجوی راننده / پلاک
  async function searchDriver(value){

    setSearch(value);
    setSelectedDriver(null);


    if(!value.trim()){
      setDrivers([]);
      return;
    }


    try{

      const data = await request(
        `/api/drivers/search?q=${encodeURIComponent(value)}`
      );

      setDrivers(data);

    }catch{
      setDrivers([]);
    }

  }




  async function submit(e){

    e.preventDefault();
    setMsg('');


    if(!selectedDriver){
      setMsg('لطفاً ابتدا راننده یا پلاک را انتخاب کنید.');
      return;
    }


    const payload = {

      driverId:selectedDriver.id,

      amount:Number(form.amount),

      currency:form.currency,

      description:form.description

    };



    try{

      await request('/api/expenses',{
        method:'POST',
        body:JSON.stringify(payload)
      });


      setMsg('هزینه ثبت شد.');

      load();


    }catch{


      const n = queueExpense(payload);

      setMsg(
        `اینترنت/سرور در دسترس نبود؛ هزینه آفلاین ذخیره شد (${n} مورد منتظر ارسال).`
      );

    }



    setForm({
      amount:'',
      currency:'TOMAN',
      description:''
    });

    setSearch('');
    setSelectedDriver(null);
    setDrivers([]);

  }




  async function decision(id,d){

    await request(
      `/api/expenses/${id}/decision`,
      {
        method:'POST',
        body:JSON.stringify({
          decision:d
        })
      }
    );

    load();

  }




  return (

<section>


<div className="section-head">

<div>
<h2>ثبت هزینه</h2>

<p>
انتخاب پلاک، شرح آزاد، ثبت دلار یا تومان
</p>

</div>

</div>




<div className="panel">

<form className="grid-form" onSubmit={submit}>


<label className="wide">

جستجوی راننده یا پلاک

<input

value={search}

onChange={
e=>searchDriver(e.target.value)
}

placeholder="نام راننده یا شماره پلاک"

/>


</label>



{drivers.length > 0 && (

<div className="wide">

{
drivers.map(d=>(

<div

key={d.id}

className="driver-result"

onClick={()=>{

setSelectedDriver(d);

setSearch(
`${d.name} - ${d.truck_number}`
);

setDrivers([]);

}}

>

{d.name}

&nbsp; - &nbsp;

{d.truck_number}

</div>

))
}

</div>

)}



{selectedDriver && (

<div className="notice">

راننده انتخاب شده:

{selectedDriver.name}

&nbsp;

({selectedDriver.truck_number})

</div>

)}




<label>

مبلغ

<input

required

type="number"

min="0"

value={form.amount}

onChange={
e=>setForm({
...form,
amount:e.target.value
})
}

/>

</label>




<label>

ارز


<select

value={form.currency}

onChange={
e=>setForm({
...form,
currency:e.target.value
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

onChange={
e=>setForm({
...form,
description:e.target.value
})
}


/>


</label>



<button>
ثبت هزینه
</button>


</form>


{msg &&

<div className="notice">
{msg}
</div>

}


</div>





{
role!=='employee' &&

<div className="panel">


<table>

<thead>

<tr>

<th>راننده</th>

<th>پلاک</th>

<th>شرح</th>

<th>مبلغ</th>

<th>وضعیت</th>

<th>عملیات</th>

</tr>

</thead>


<tbody>


{

items.map(x=>(

<tr key={x.id}>


<td>
{x.driver_name}
</td>


<td>
{x.plate}
</td>


<td>
{x.title}
</td>


<td>

{Number(x.amount).toLocaleString()}

&nbsp;

{x.currency==='USD'?'$':'تومان'}

</td>


<td>

<span className={`status ${x.status}`}>

{x.status==='pending'
?'منتظر'
:x.status==='approved'
?'تأیید'
:'رد'}

</span>

</td>



<td>


{
x.status==='pending' &&

<div className="actions">


<button

onClick={()=>decision(x.id,'approved')}

>

تأیید

</button>


<button

className="ghost danger"

onClick={()=>decision(x.id,'rejected')}

>

رد

</button>


</div>

}


</td>


</tr>

))

}


</tbody>


</table>


</div>

}



</section>

);

}
