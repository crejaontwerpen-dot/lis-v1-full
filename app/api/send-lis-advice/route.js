import nodemailer from "nodemailer";

export async function POST(req) {
  try {
    const advice = await req.json();

    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT || 465),
      secure: process.env.MAIL_SECURE !== "false",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    const html = `
      <p>Nieuw LiS-advies vanuit de keuzetool.</p>
      <pre>${advice.advicePlain || ""}</pre>
    `;

    await transporter.sendMail({
      from: process.env.MAIL_FROM || "LiS Keuzetool <no-reply@example.com>",
      to: "rob@creja.nl",
      subject: `Nieuw LiS-advies – ${advice.name || "Bezoeker"}`,
      text: advice.advicePlain || "",
      html,
    });

    return Response.json({ ok: true });
  } catch (e) {
    console.error("send-lis-advice error", e);
    return Response.json(
      { ok: false, error: e.message || "Mail error" },
      { status: 500 }
    );
  }
}
