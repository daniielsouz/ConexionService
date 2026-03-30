import nodemailer from "nodemailer";

const CONTACT_MAX_LENGTH = 2000;
const EMAIL_TO = process.env.EMAIL_TO || "danielsouz.dev@gmail.com";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: (process.env.EMAIL_USER || "").trim(),
    pass: (process.env.EMAIL_PASS || "").trim(),
  },
  tls: { minVersion: "TLSv1.2" },
  connectionTimeout: 10000,
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
    !payload.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email);

  const missing = [];
  if (!payload.name) missing.push("name");
  if (!payload.phone) missing.push("phone");
  if (!payload.serviceDescription) missing.push("serviceDescription");

  if (missing.length > 0) {
    return { error: `Missing required fields: ${missing.join(", ")}` };
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

  async function parseBody(request) {
    const contentType = String(request.headers["content-type"] || "").toLowerCase();

    if (request.body) {
      // Vercel às vezes entrega body como string já lida
      if (typeof request.body === "string") {
        try {
          return JSON.parse(request.body);
        } catch {
          return {};
        }
      }
      // Ou como objeto já parseado
      if (typeof request.body === "object" && Object.keys(request.body).length > 0) {
        return request.body;
      }
    }

    const raw = await new Promise((resolve, reject) => {
      let data = "";
      request.on("data", (chunk) => (data += chunk));
      request.on("end", () => resolve(data));
      request.on("error", reject);
    });
    if (!raw) return {};

    if (contentType.includes("application/json")) {
      try {
        return JSON.parse(raw);
      } catch {
        return {};
      }
    }

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const params = new URLSearchParams(raw);
      return Object.fromEntries(params.entries());
    }

    // fallback: try JSON, senão vazio
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  const body = await parseBody(req);

  const validation = validateContactPayload(body);
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
    return res.status(500).json({
      error: "Failed to send message.",
      detail: error.message || "smtp error",
    });
  }
}
