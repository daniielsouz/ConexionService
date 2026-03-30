import nodemailer from "nodemailer";

const CONTACT_MAX_LENGTH = 2000;
const EMAIL_TO = process.env.EMAIL_TO || "danielsouz.dev@gmail.com";
const EMAIL_LOGO_URL =
  process.env.EMAIL_LOGO_URL ||
  "https://res.cloudinary.com/dmdobsh3w/image/upload/v1774894340/logo_okiuy4.png";

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
    const areaText = payload.area ? `${payload.area} m2` : "N/A";
    const htmlBody = `
      <table width="100%" cellpadding="0" cellspacing="0" style="font-family:'Segoe UI',Arial,sans-serif;background:#081110;padding:24px;">
        <tr><td align="center" style="padding-bottom:18px;">
          <img src="${EMAIL_LOGO_URL}" alt="Conexion Services" style="height:60px;width:auto;" />
        </td></tr>
        <tr><td style="max-width:680px;margin:0 auto;background:linear-gradient(180deg,#0fa189 0%,#0b7464 100%);border-radius:16px;padding:22px;box-shadow:0 14px 32px rgba(0,0,0,0.32);color:#fdfefe;">
          <h2 style="margin:0 0 10px 0;font-size:22px;color:#ffffff;">New contact from the site</h2>
          <p style="margin:0 0 16px 0;color:rgba(255,255,255,0.9);font-size:14px;">Lead received via contact form.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0c1f1e;border-radius:12px;padding:14px;border:1px solid rgba(122,232,215,0.25);">
            <tr><td style="padding:6px 0;color:#82ffe6;font-weight:800;">Name</td><td style="padding:6px 0;color:#fdfefe;">${payload.name}</td></tr>
            <tr><td style="padding:6px 0;color:#82ffe6;font-weight:800;">Email</td><td style="padding:6px 0;color:#fdfefe;">${payload.email || "N/A"}</td></tr>
            <tr><td style="padding:6px 0;color:#82ffe6;font-weight:800;">Phone</td><td style="padding:6px 0;color:#fdfefe;">${payload.phone}</td></tr>
            <tr><td style="padding:6px 0;color:#82ffe6;font-weight:800;">Area</td><td style="padding:6px 0;color:#fdfefe;">${areaText}</td></tr>
            <tr><td style="padding:6px 0;color:#82ffe6;font-weight:800;">Property type</td><td style="padding:6px 0;color:#fdfefe;">${payload.propertyType || "N/A"}</td></tr>
            <tr><td style="padding:6px 0;color:#82ffe6;font-weight:800;">City</td><td style="padding:6px 0;color:#fdfefe;">${payload.city || "N/A"}</td></tr>
            <tr><td style="padding:6px 0;color:#82ffe6;font-weight:800;">Preferred timeline</td><td style="padding:6px 0;color:#fdfefe;">${payload.timeline || "N/A"}</td></tr>
          </table>
          <div style="margin-top:16px;padding:16px;border:1px solid rgba(255,255,255,0.25);border-radius:12px;background:rgba(0,0,0,0.18);">
            <p style="margin:0 0 8px 0;font-weight:800;color:#ffffff;">Service description</p>
            <p style="margin:0;white-space:pre-wrap;line-height:1.6;color:#f4fbf9;">${payload.serviceDescription}</p>
          </div>
        </td></tr>
        <tr><td align="center" style="padding-top:14px;color:#b6c6c3;font-size:12px;">
          Sent automatically by the Conexion Services site.
        </td></tr>
      </table>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER || "noreplyconexionservice@gmail.com",
      to: EMAIL_TO,
      subject: `New contact from ${payload.name}`,
      replyTo: payload.email || undefined,
      text: [
        `Name: ${payload.name}`,
        `Email: ${payload.email || "N/A"}`,
        `Phone: ${payload.phone}`,
        `Area: ${areaText}`,
        `Property type: ${payload.propertyType || "N/A"}`,
        `City: ${payload.city || "N/A"}`,
        `Preferred timeline: ${payload.timeline || "N/A"}`,
        "",
        payload.serviceDescription,
      ].join("\\n"),
      html: htmlBody,
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
