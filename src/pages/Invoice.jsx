import {
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import {
  useLocation,
  useNavigate,
  useParams
} from 'react-router-dom';

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

import { labels } from '../lib/i18n';
import { request } from '../lib/api';


export default function Invoice() {

  const { id } = useParams();

  const location = useLocation();

  const navigate = useNavigate();

  const invoiceRef = useRef(null);


  const [lang, setLang] = useState('fa');

  const [data, setData] = useState(null);

  const [error, setError] = useState('');

  const [rangeMode, setRangeMode] =
    useState('all');

  const [fromDate, setFromDate] =
    useState('');

  const [toDate, setToDate] =
    useState('');

  const [sharing, setSharing] =
    useState(false);

  const [shareMessage, setShareMessage] =
    useState('');


  const t = labels[lang] || {};

  const rtl = lang === 'fa';


  const isCompany =
    location.pathname.includes(
      '/invoice/company/'
    );

  const isDriver =
    location.pathname.includes(
      '/invoice/driver/'
    );


  // ========================================
  // دریافت اطلاعات
  // ========================================

  useEffect(() => {

    async function load() {

      try {

        setError('');


        if (isCompany && id) {

          const result =
            await request(
              `/api/companies/${id}/account`
            );


          setData({

            entityType: 'company',

            entity: result.company,

            transactions:
              result.transactions || [],

            expenses: []

          });


          if (result.company?.language) {

            setLang(
              result.company.language
            );

          }


          return;

        }


        if (isDriver && id) {

          const result =
            await request(
              `/api/drivers/${id}/account`
            );


          setData({

            entityType: 'driver',

            entity: result.driver,

            transactions:
              result.transactions || [],

            expenses:
              result.expenses || []

          });


          if (result.driver?.language) {

            setLang(
              result.driver.language
            );

          }


          return;

        }


        setError(

          lang === 'tr'

            ? 'Fatura bir sürücü veya firma hesabından açılmalıdır.'

            : 'فاکتور باید از حساب یک راننده یا شرکت باز شود.'

        );


      } catch (err) {

        setError(

          err.message ||

          (
            lang === 'tr'

              ? 'Fatura bilgileri alınamadı.'

              : 'خطا در دریافت اطلاعات فاکتور'
          )

        );

      }

    }


    load();

  }, [
    id,
    isCompany,
    isDriver
  ]);



  // ========================================
  // تبدیل اعداد فارسی / عربی به انگلیسی
  // ========================================

  function toEnglishDigits(value) {

    return String(value ?? '')

      .replace(
        /[۰-۹]/g,
        digit =>
          '۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)
      )

      .replace(
        /[٠-٩]/g,
        digit =>
          '٠١٢٣٤٥٦٧٨٩'.indexOf(digit)
      );

  }



  // ========================================
  // همه ردیف‌های فاکتور
  // ========================================

  const allRows = useMemo(() => {

    if (!data) return [];


    const transactionRows =
      (data.transactions || []).map(
        item => ({

          id: `t-${item.id}`,

          type: item.type,

          amount:
            Number(item.amount || 0),

          currency:
            item.currency,

          description:
            item.description || '',

          occurredAt:
            item.occurred_at,

          source: 'transaction'

        })
      );


    const expenseRows =
      (data.expenses || []).map(
        item => ({

          id: `e-${item.id}`,

          type: 'expense',

          amount:
            Number(item.amount || 0),

          currency:
            item.currency,

          description:
            item.description || '',

          occurredAt:
            item.occurred_at,

          source: 'expense'

        })
      );


    return [
      ...transactionRows,
      ...expenseRows
    ].sort(

      (a, b) =>

        new Date(
          a.occurredAt
        ).getTime()

        -

        new Date(
          b.occurredAt
        ).getTime()

    );

  }, [data]);



  // ========================================
  // فیلتر بازه زمانی
  // ========================================

  const filteredRows = useMemo(() => {

    if (rangeMode === 'all') {

      return allRows;

    }


    const now = new Date();


    if (rangeMode === 'month') {

      const start =
        new Date(

          now.getFullYear(),

          now.getMonth(),

          1,

          0,
          0,
          0,
          0

        );


      const end =
        new Date(

          now.getFullYear(),

          now.getMonth() + 1,

          0,

          23,
          59,
          59,
          999

        );


      return allRows.filter(row => {

        const date =
          new Date(
            row.occurredAt
          );


        return (
          date >= start &&
          date <= end
        );

      });

    }


    if (rangeMode === 'custom') {

      return allRows.filter(row => {

        const date =
          new Date(
            row.occurredAt
          );


        if (fromDate) {

          const start =
            new Date(
              `${fromDate}T00:00:00`
            );


          if (date < start) {

            return false;

          }

        }


        if (toDate) {

          const end =
            new Date(
              `${toDate}T23:59:59`
            );


          if (date > end) {

            return false;

          }

        }


        return true;

      });

    }


    return allRows;

  }, [
    allRows,
    rangeMode,
    fromDate,
    toDate
  ]);



  // ========================================
  // محاسبه جمع‌ها
  // ========================================

  const totals = useMemo(() => {

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


    for (
      const row of filteredRows
    ) {

      if (
        !result[row.currency]
      ) {

        continue;

      }


      if (
        row.type === 'receipt'
      ) {

        result[
          row.currency
        ].receipt +=
          row.amount;

      }


      if (
        row.type === 'payment'
      ) {

        result[
          row.currency
        ].payment +=
          row.amount;

      }


      if (
        row.type === 'expense'
      ) {

        result[
          row.currency
        ].expense +=
          row.amount;

      }


      if (
        row.type === 'debt'
      ) {

        result[
          row.currency
        ].debt +=
          row.amount;

      }

    }


    for (
      const currency of
      ['USD', 'TOMAN']
    ) {

      if (
        data?.entityType ===
        'company'
      ) {

        result[currency].balance =

          result[currency].receipt

          -

          result[currency].payment

          -

          result[currency].debt;

      } else {

        result[currency].balance =

          result[currency].payment

          +

          result[currency].expense

          +

          result[currency].debt

          -

          result[currency].receipt;

      }

    }


    return result;

  }, [
    filteredRows,
    data
  ]);



  // ========================================
  // نمایش مبلغ
  // absolute فقط برای نمایش است
  // ========================================

  function money(
    value,
    currency,
    absolute = false
  ) {

    let amount =
      Number(value || 0);


    if (absolute) {

      amount =
        Math.abs(amount);

    }


    const formatted =
      amount.toLocaleString(
        'en-US'
      );


    return `${toEnglishDigits(formatted)} ${
      currency === 'USD'
        ? '$'
        : lang === 'tr'
          ? 'Toman'
          : 'تومان'
    }`;

  }



  // ========================================
  // نام عملیات
  // ========================================

  function typeLabel(type) {

    if (lang === 'tr') {

      if (
        type === 'receipt'
      ) {

        return 'Tahsilat';

      }


      if (
        type === 'payment'
      ) {

        return 'Ödeme';

      }


      if (
        type === 'expense'
      ) {

        return 'Masraf';

      }


      if (
        type === 'debt'
      ) {

        return 'Borç';

      }

    }


    if (
      type === 'receipt'
    ) {

      return 'دریافت';

    }


    if (
      type === 'payment'
    ) {

      return 'پرداخت';

    }


    if (
      type === 'expense'
    ) {

      return 'هزینه';

    }


    if (
      type === 'debt'
    ) {

      return 'بدهی';

    }


    return type;

  }



  // ========================================
  // تاریخ با اعداد انگلیسی
  // ========================================

  function formatDate(value) {

    if (!value) {

      return '—';

    }


    try {

      const formatted =
        new Date(
          value
        ).toLocaleDateString(

          lang === 'fa'

            ? 'fa-IR-u-nu-latn'

            : 'tr-TR'

        );


      return toEnglishDigits(
        formatted
      );


    } catch {

      return toEnglishDigits(
        value
      );

    }

  }



  // ========================================
  // عنوان بازه فاکتور
  // ========================================

  function rangeLabel() {

    if (
      rangeMode === 'all'
    ) {

      return lang === 'tr'

        ? 'Tüm işlemler'

        : 'همه تراکنش‌ها';

    }


    if (
      rangeMode === 'month'
    ) {

      return lang === 'tr'

        ? 'Bu ay'

        : 'این ماه';

    }


    if (
      rangeMode === 'custom'
    ) {

      if (
        fromDate &&
        toDate
      ) {

        return (
          `${toEnglishDigits(fromDate)} - ${toEnglishDigits(toDate)}`
        );

      }


      if (fromDate) {

        return `${
          lang === 'tr'
            ? 'Başlangıç'
            : 'از'
        } ${toEnglishDigits(fromDate)}`;

      }


      if (toDate) {

        return `${
          lang === 'tr'
            ? 'Bitiş'
            : 'تا'
        } ${toEnglishDigits(toDate)}`;

      }


      return lang === 'tr'

        ? 'Özel tarih aralığı'

        : 'بازه دلخواه';

    }


    return '';

  }



  // ========================================
  // ساخت PDF از فاکتور
  // ========================================

  async function createInvoicePdf() {

    if (!invoiceRef.current) {

      throw new Error(
        lang === 'tr'
          ? 'Fatura bulunamadı.'
          : 'فاکتور پیدا نشد.'
      );

    }


    const canvas =
      await html2canvas(
        invoiceRef.current,
        {

          scale: 2,

          useCORS: true,

          backgroundColor:
            '#ffffff',

          logging: false

        }
      );


    const imageData =
      canvas.toDataURL(
        'image/jpeg',
        0.95
      );


    const pdf =
      new jsPDF({

        orientation: 'portrait',

        unit: 'mm',

        format: 'a5',

        compress: true

      });


    const pageWidth =
      pdf.internal.pageSize.getWidth();

    const pageHeight =
      pdf.internal.pageSize.getHeight();


    const imageWidth =
      pageWidth;


    const imageHeight =
      (
        canvas.height *
        imageWidth
      ) /
      canvas.width;


    let heightLeft =
      imageHeight;


    let position = 0;


    pdf.addImage(

      imageData,

      'JPEG',

      0,

      position,

      imageWidth,

      imageHeight,

      undefined,

      'FAST'

    );


    heightLeft -=
      pageHeight;


    while (
      heightLeft > 0
    ) {

      position =
        heightLeft -
        imageHeight;


      pdf.addPage();


      pdf.addImage(

        imageData,

        'JPEG',

        0,

        position,

        imageWidth,

        imageHeight,

        undefined,

        'FAST'

      );


      heightLeft -=
        pageHeight;

    }


    return pdf;

  }



  // ========================================
  // دانلود PDF در صورت عدم پشتیبانی Share
  // ========================================

  function downloadBlob(
    blob,
    filename
  ) {

    const url =
      URL.createObjectURL(blob);


    const link =
      document.createElement('a');


    link.href =
      url;

    link.download =
      filename;


    document.body.appendChild(
      link
    );


    link.click();


    link.remove();


    setTimeout(
      () => {

        URL.revokeObjectURL(
          url
        );

      },
      1000
    );

  }



  // ========================================
  // اشتراک گذاری فاکتور
  // ========================================

  async function shareInvoice() {

    if (sharing) {

      return;

    }


    try {

      setSharing(true);

      setShareMessage('');


      const pdf =
        await createInvoicePdf();


      const blob =
        pdf.output('blob');


      const filename =
        `${invoiceNumber}.pdf`;


      const file =
        new File(
          [blob],
          filename,
          {
            type:
              'application/pdf'
          }
        );


      const shareData = {

        files: [file],

        title:
          lang === 'tr'
            ? 'VALI Fatura'
            : 'فاکتور VALI',

        text:
          lang === 'tr'
            ? `${entity.name} - ${invoiceNumber}`
            : `فاکتور ${entity.name} - ${invoiceNumber}`

      };


      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare(
          {
            files: [file]
          }
        )
      ) {

        await navigator.share(
          shareData
        );


        setShareMessage(

          lang === 'tr'

            ? 'Fatura paylaşım için hazırlandı.'

            : 'فاکتور برای اشتراک‌گذاری آماده شد.'

        );


        return;

      }


      downloadBlob(
        blob,
        filename
      );


      setShareMessage(

        lang === 'tr'

          ? 'Bu cihaz dosya paylaşımını desteklemiyor. PDF indirildi.'

          : 'اشتراک‌گذاری فایل در این مرورگر پشتیبانی نمی‌شود؛ PDF دانلود شد.'

      );


    } catch (err) {

      if (
        err?.name ===
        'AbortError'
      ) {

        setShareMessage('');

        return;

      }


      console.error(err);


      setShareMessage(

        lang === 'tr'

          ? 'Fatura paylaşılırken hata oluştu.'

          : 'در اشتراک‌گذاری فاکتور خطایی رخ داد.'

      );


    } finally {

      setSharing(false);

    }

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


          <button
            onClick={
              () =>
                navigate(-1)
            }
          >

            {
              lang === 'tr'
                ? 'Geri'
                : 'بازگشت'
            }

          </button>

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

          {
            lang === 'tr'

              ? 'Fatura hazırlanıyor...'

              : 'در حال آماده‌سازی فاکتور...'
          }

        </div>

      </section>

    );

  }



  const entity =
    data.entity;


  const invoiceNumber =
    toEnglishDigits(

      `VT-${
        data.entityType ===
        'company'
          ? 'C'
          : 'D'
      }-${
        String(id).padStart(
          6,
          '0'
        )
      }`

    );



  // ========================================
  // صفحه
  // ========================================

  return (

    <section>


      {/* ================================
          هدر کنترل‌ها
      ================================ */}

      <div
        className="section-head no-print"
      >


        <div>

          <h2>

            {
              lang === 'tr'

                ? 'Hesap Faturası'

                : 'فاکتور حساب'
            }

          </h2>


          <p>

            {
              lang === 'tr'

                ? 'Tarih aralığı, işlem detayları ve ayrı USD / Toman toplamları'

                : 'بازه زمانی، ریز تراکنش‌ها و جمع مستقل دلار و تومان'
            }

          </p>

        </div>



        <div className="actions">


          <select

            value={lang}

            onChange={
              e =>
                setLang(
                  e.target.value
                )
            }

          >

            <option value="fa">

              فارسی

            </option>

            <option value="tr">

              Türkçe

            </option>

          </select>



          <button

            className="ghost"

            onClick={
              () =>
                navigate(-1)
            }

          >

            {
              lang === 'tr'
                ? 'Geri'
                : 'بازگشت'
            }

          </button>



          <button
            onClick={
              () =>
                window.print()
            }
          >

            {
              lang === 'tr'

                ? 'Yazdır / PDF'

                : 'چاپ / PDF'
            }

          </button>



          <button

            type="button"

            onClick={
              shareInvoice
            }

            disabled={
              sharing
            }

          >

            {
              sharing

                ? (
                  lang === 'tr'
                    ? 'Hazırlanıyor...'
                    : 'در حال آماده‌سازی...'
                )

                : (
                  lang === 'tr'
                    ? 'Paylaş'
                    : 'اشتراک‌گذاری'
                )
            }

          </button>


        </div>

      </div>



      {/* ================================
          پیام اشتراک گذاری
      ================================ */}

      {
        shareMessage
        &&
        (

          <div
            className="panel no-print"
            style={{
              marginBottom: '16px'
            }}
          >

            {shareMessage}

          </div>

        )
      }



      {/* ================================
          انتخاب بازه
      ================================ */}

      <div
        className="panel no-print"
      >


        <div className="grid-form">


          <label>


            {
              lang === 'tr'

                ? 'Fatura dönemi'

                : 'بازه فاکتور'
            }


            <select

              value={
                rangeMode
              }

              onChange={
                e =>
                  setRangeMode(
                    e.target.value
                  )
              }

            >


              <option value="all">

                {
                  lang === 'tr'

                    ? 'Tüm işlemler'

                    : 'همه تراکنش‌ها'
                }

              </option>


              <option value="month">

                {
                  lang === 'tr'

                    ? 'Bu ay'

                    : 'این ماه'
                }

              </option>


              <option value="custom">

                {
                  lang === 'tr'

                    ? 'Özel tarih aralığı'

                    : 'بازه دلخواه'
                }

              </option>


            </select>


          </label>



          {
            rangeMode ===
            'custom'
            &&
            (

              <>


                <label>


                  {
                    lang === 'tr'

                      ? 'Başlangıç tarihi'

                      : 'از تاریخ'
                  }


                  <input

                    type="date"

                    value={
                      fromDate
                    }

                    onChange={
                      e =>
                        setFromDate(
                          e.target.value
                        )
                    }

                  />


                </label>



                <label>


                  {
                    lang === 'tr'

                      ? 'Bitiş tarihi'

                      : 'تا تاریخ'
                  }


                  <input

                    type="date"

                    value={
                      toDate
                    }

                    onChange={
                      e =>
                        setToDate(
                          e.target.value
                        )
                    }

                  />


                </label>


              </>

            )
          }


        </div>

      </div>



      {/* ================================
          خود فاکتور
      ================================ */}

      <div

        ref={
          invoiceRef
        }

        className="invoice-sheet"

        dir={
          rtl
            ? 'rtl'
            : 'ltr'
        }

      >


        {/* ================================
            بالای فاکتور
        ================================ */}

        <div className="invoice-top">


          <div>


            <h1>

              {
                lang === 'tr'

                  ? 'VALİ KARDEŞLER TRANSPORT'

                  : 'شرکت حمل و نقل برادران والی'
              }

            </h1>


            <p>

              {
                t.invoice ||

                (
                  lang === 'tr'
                    ? 'Fatura'
                    : 'فاکتور'
                )
              }

              {' '}

              #

              {
                invoiceNumber
              }

            </p>


            <small>

              {
                rangeLabel()
              }

            </small>


          </div>



          <div className="invoice-badge">

            A5

          </div>


        </div>



        {/* ================================
            اطلاعات طرف حساب
        ================================ */}

        <div className="invoice-info">


          {
            data.entityType ===
            'driver'

              ? (

                <>


                  <span>

                    <b>

                      {
                        lang === 'tr'

                          ? 'Sürücü'

                          : (
                            t.driver ||
                            'راننده'
                          )
                      }

                      :

                    </b>

                    {' '}

                    {
                      entity.name
                    }

                  </span>



                  <span>

                    <b>

                      {
                        lang === 'tr'

                          ? 'Plaka'

                          : (
                            t.truck ||
                            'پلاک'
                          )
                      }

                      :

                    </b>

                    {' '}

                    {
                      toEnglishDigits(
                        entity.truck_number ||
                        '—'
                      )
                    }

                  </span>



                  <span>

                    <b>

                      {
                        lang === 'tr'

                          ? 'Telefon'

                          : (
                            t.phone ||
                            'تماس'
                          )
                      }

                      :

                    </b>

                    {' '}

                    {
                      toEnglishDigits(
                        entity.phone ||
                        '—'
                      )
                    }

                  </span>


                </>

              )

              : (

                <>


                  <span>

                    <b>

                      {
                        lang === 'tr'
                          ? 'Firma'
                          : 'شرکت'
                      }

                      :

                    </b>

                    {' '}

                    {
                      entity.name
                    }

                  </span>



                  <span>

                    <b>

                      {
                        lang === 'tr'

                          ? 'Telefon'

                          : (
                            t.phone ||
                            'تماس'
                          )
                      }

                      :

                    </b>

                    {' '}

                    {
                      toEnglishDigits(
                        entity.phone ||
                        '—'
                      )
                    }

                  </span>



                  {
                    entity.note
                    &&
                    (

                      <span>

                        <b>

                          {
                            lang === 'tr'

                              ? 'Not'

                              : 'یادداشت'
                          }

                          :

                        </b>

                        {' '}

                        {
                          entity.note
                        }

                      </span>

                    )
                  }


                </>

              )
          }


        </div>



        {/* ================================
            جدول
        ================================ */}

        <table>


          <thead>


            <tr>


              <th>

                {
                  lang === 'tr'

                    ? 'Tarih'

                    : (
                      t.date ||
                      'تاریخ'
                    )
                }

              </th>


              <th>

                {
                  lang === 'tr'

                    ? 'Açıklama'

                    : (
                      t.description ||
                      'شرح'
                    )
                }

              </th>


              <th>

                {
                  lang === 'tr'

                    ? 'Tür'

                    : 'نوع'
                }

              </th>


              <th>

                {
                  lang === 'tr'

                    ? 'Tutar'

                    : 'مبلغ'
                }

              </th>


            </tr>


          </thead>



          <tbody>


            {
              filteredRows.map(
                row => (

                  <tr
                    key={
                      row.id
                    }
                  >


                    <td>

                      {
                        formatDate(
                          row.occurredAt
                        )
                      }

                    </td>


                    <td>

                      {
                        row.description ||
                        '—'
                      }

                    </td>


                    <td>

                      {
                        typeLabel(
                          row.type
                        )
                      }

                    </td>


                    <td>

                      {
                        money(
                          row.amount,
                          row.currency
                        )
                      }

                    </td>


                  </tr>

                )
              )
            }



            {
              !filteredRows.length
              &&
              (

                <tr>

                  <td colSpan="4">

                    {
                      lang === 'tr'

                        ? 'Bu tarih aralığında işlem bulunmuyor.'

                        : 'در این بازه زمانی تراکنشی ثبت نشده است.'
                    }

                  </td>

                </tr>

              )
            }


          </tbody>


        </table>



        {/* ================================
            جمع حساب
        ================================ */}

        <div className="invoice-totals">


          <div>

            <span>

              {
                lang === 'tr'

                  ? 'USD Tahsilat'

                  : 'دریافت دلار'
              }

            </span>


            <b>

              {
                money(
                  totals.USD.receipt,
                  'USD'
                )
              }

            </b>

          </div>



          <div>

            <span>

              {
                lang === 'tr'

                  ? 'USD Ödeme'

                  : 'پرداخت دلار'
              }

            </span>


            <b>

              {
                money(
                  totals.USD.payment,
                  'USD'
                )
              }

            </b>

          </div>



          {
            data.entityType ===
            'driver'
            &&
            (

              <div>


                <span>

                  {
                    lang === 'tr'

                      ? 'USD Masraf'

                      : 'هزینه دلار'
                  }

                </span>


                <b>

                  {
                    money(
                      totals.USD.expense,
                      'USD'
                    )
                  }

                </b>


              </div>

            )
          }



          {
            data.entityType ===
            'company'
            &&
            (

              <div>


                <span>

                  {
                    lang === 'tr'

                      ? 'USD Borç'

                      : 'بدهی دلار'
                  }

                </span>


                <b>

                  {
                    money(
                      totals.USD.debt,
                      'USD',
                      true
                    )
                  }

                </b>


              </div>

            )
          }



          <div>


            <span>

              {
                lang === 'tr'

                  ? 'USD Bakiye'

                  : 'مانده دلار'
              }

            </span>


            <b>

              {
                money(
                  totals.USD.balance,
                  'USD',
                  true
                )
              }

            </b>


          </div>



          <div>


            <span>

              {
                lang === 'tr'

                  ? 'Toman Tahsilat'

                  : 'دریافت تومان'
              }

            </span>


            <b>

              {
                money(
                  totals.TOMAN.receipt,
                  'TOMAN'
                )
              }

            </b>


          </div>



          <div>


            <span>

              {
                lang === 'tr'

                  ? 'Toman Ödeme'

                  : 'پرداخت تومان'
              }

            </span>


            <b>

              {
                money(
                  totals.TOMAN.payment,
                  'TOMAN'
                )
              }

            </b>


          </div>



          {
            data.entityType ===
            'driver'
            &&
            (

              <div>


                <span>

                  {
                    lang === 'tr'

                      ? 'Toman Masraf'

                      : 'هزینه تومان'
                  }

                </span>


                <b>

                  {
                    money(
                      totals.TOMAN.expense,
                      'TOMAN'
                    )
                  }

                </b>


              </div>

            )
          }



          {
            data.entityType ===
            'company'
            &&
            (

              <div>


                <span>

                  {
                    lang === 'tr'

                      ? 'Toman Borç'

                      : 'بدهی تومان'
                  }

                </span>


                <b>

                  {
                    money(
                      totals.TOMAN.debt,
                      'TOMAN',
                      true
                    )
                  }

                </b>


              </div>

            )
          }



          <div>


            <span>

              {
                lang === 'tr'

                  ? 'Toman Bakiye'

                  : 'مانده تومان'
              }

            </span>


            <b>

              {
                money(
                  totals.TOMAN.balance,
                  'TOMAN',
                  true
                )
              }

            </b>


          </div>


        </div>



        {/* ================================
            پایین فاکتور
        ================================ */}

        <footer>


          <div>

            <b>
              VAHID VALI
            </b>

            <span>
              TEL: +989120801384
            </span>

          </div>



          <div>

            <b>
              HABIB VALI
            </b>

            <span>
              TEL: +989147257526
            </span>

          </div>



          <div className="sign">

            {
              lang === 'tr'

                ? 'İmza'

                : 'امضا'
            }

          </div>


        </footer>


      </div>


    </section>

  );

}
