import nodemailer from "nodemailer";

export async function POST(req) {
  try {
    const body = await req.json();
    const { to, subject, html, text } = body;

    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT || 465),
      secure: process.env.MAIL_SECURE !== "false",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.MAIL_FROM || "LiS Keuzetool <no-reply@example.com>",
      to,
      subject,
      text: text || "",
      html: html || "",
    });

    return Response.json({ ok: true });
  } catch (e) {
    console.error("send-lis-advice-user error", e);
    return Response.json(
      { ok: false, error: e.message || "Mail error" },
      { status: 500 }
    );
  }
}
