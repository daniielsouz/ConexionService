import nodemailer from "nodemailer";

const CONTACT_MAX_LENGTH = 2000;
const EMAIL_TO = process.env.EMAIL_TO || "danielsouz.dev@gmail.com";

const transporter = nodemailer.createTransport({
  service: "gmail",
  pool: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function sanitizeField(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function validateContactPayload(body = {}) {
  const payload = {
    name: sanitizeField(body.name, 120),
    email: sanitizeField(body.email, 160),
    phone: sanitizeField(body.phone, 30),
    serviceDescription: sanitizeField(body.serviceDescription, CONTACT_MAX_LENGTH),
  };

  const emailIsValid =
    !payload.email || /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(payload.email);

  if (!payload.name || !payload.phone || !payload.serviceDescription) {
    return { error: "Missing required fields." };
  }

  if (!emailIsValid) {
    return { error: "Invalid email." };
  }

  return { payload };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const validation = validateContactPayload(req.body);
  if (validation.error) {
    return res.status(400).json({ error: validation.error });
  }

  const { payload } = validation;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER || "noreplyconexionservice@gmail.com",
      to: EMAIL_TO,
      subject: `New contact from ${payload.name}`,
      replyTo: payload.email || undefined,
      text: [
        `Name: ${payload.name}`,
        `Email: ${payload.email || "N/A"}`,
        `Phone: ${payload.phone}`,
        "",
        payload.serviceDescription,
      ].join("\\n"),
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("contact-send-error", error);
    return res.status(500).json({ error: "Failed to send message." });
  }
}
