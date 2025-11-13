import nodemailer from 'nodemailer';

function transporter(){
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

export async function POST(req){
  const { to, subject, html, text } = await req.json();

  if (!to || !subject || (!html && !text)){
    return Response.json(
      { ok:false, error:'Missing to/subject/body' },
      { status: 400 }
    );
  }

  try {
    await transporter().sendMail({
      from: process.env.MAIL_FROM,
      to,
      subject,
      html: html || undefined,
      text: text || undefined,
    });

    return Response.json({ ok:true });
  } catch (e){
    console.error(e);
    return Response.json(
      { ok:false, error: e?.message || 'send error' },
      { status: 500 }
    );
  }
}
