// src/lib/email.ts

export async function sendEmail(toEmail: string, toName: string, subject: string, htmlContent: string) {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    console.error("⚠️ لم يتم العثور على مفتاح Brevo API في ملف .env");
    return false;
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "api-key": apiKey, 
      },
      body: JSON.stringify({
        // يمكنك لاحقاً تغيير الإيميل ليطابق اسم النطاق الخاص بك
        sender: { name: "منصة Funder", email: "contact@funder-dz.com" }, 
        to: [{ email: toEmail, name: toName }],
        subject: subject,
        htmlContent: htmlContent,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ فشل إرسال الإيميل عبر Brevo:", errorData);
      return false;
    }

    console.log(`✉️ تم إرسال الإيميل بنجاح إلى ${toEmail}`);
    return true;
  } catch (error) {
    console.error("❌ خطأ في الاتصال بخوادم Brevo:", error);
    return false;
  }
}
