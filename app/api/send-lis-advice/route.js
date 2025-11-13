import nodemailer from 'nodemailer';

function transporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

export async function POST(req) {
  const advice = await req.json();

  if (!advice || !advice.advicePlain) {
    return Response.json(
      { ok: false, error: 'Missing advice content' },
      { status: 400 }
    );
  }

  try {
    await transporter().sendMail({
      from: process.env.MAIL_FROM,
      to: 'rob@creja.nl',
      subject: `Nieuw LiS-advies – ${advice.name || 'Bezoeker'}`,
      text: advice.advicePlain,
      html: `<pre>${advice.advicePlain}</pre>`,
    });

    return Response.json({ ok: true });
  } catch (e) {
    console.error(e);
    return Response.json(
      { ok: false, error: e?.message || 'send error' },
      { status: 500 }
    );
  }
}
