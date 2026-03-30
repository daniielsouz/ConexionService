require("dotenv").config();

const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const EMAIL_USER =
  process.env.EMAIL_USER || "noreplyconexionservice@gmail.com";
const EMAIL_FROM =
  process.env.EMAIL_FROM || EMAIL_USER || "noreplyconexionservice@gmail.com";
const EMAIL_TO =
  process.env.EMAIL_TO || "danielsouz.dev@gmail.com";
const CONTACT_MAX_LENGTH = 2000;
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const GOOGLE_PLACE_ID = process.env.GOOGLE_PLACE_ID;
const GOOGLE_BUSINESS_QUERY = process.env.GOOGLE_BUSINESS_QUERY;
const GOOGLE_REVIEWS_LIMIT = Math.min(
  Math.max(Number(process.env.GOOGLE_REVIEWS_LIMIT) || 3, 1),
  5
);
const GOOGLE_PLACES_BASE_URL = "https://places.googleapis.com/v1";
const REVIEWS_CACHE_TTL_MS = 1000 * 60 * 30;

let reviewsCache = {
  expiresAt: 0,
  payload: null,
};

app.disable("x-powered-by");
app.use(cors());
app.use(express.json({ limit: "20kb" }));

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: { minVersion: "TLSv1.2" },
  connectionTimeout: 10000,
});

function sanitizeField(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function sanitizeNumberString(value, maxLength) {
  const digits = String(value || "").replace(/[^\d]/g, "").slice(0, maxLength);
  return digits;
}

function sanitizeNoDigits(value, maxLength) {
  return String(value || "").replace(/\d+/g, "").trim().slice(0, maxLength);
}

function formatTimeline(value) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (n) => String(n).padStart(2, "0");
  const dd = pad(date.getDate());
  const mm = pad(date.getMonth() + 1);
  const yyyy = date.getFullYear();
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

function validateContactPayload(body = {}) {
  const payload = {
    name: sanitizeField(body.name, 120),
    email: sanitizeField(body.email, 160),
    phone: sanitizeField(body.phone, 30),
    serviceDescription: sanitizeField(
      body.serviceDescription,
      CONTACT_MAX_LENGTH
    ),
    area: sanitizeNumberString(body.area, 12),
    propertyType: sanitizeNoDigits(body.propertyType, 120),
    city: sanitizeField(body.city, 120),
    timeline: sanitizeField(body.timeline, 120),
  };

  const emailIsValid =
    !payload.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email);

  if (!payload.name || !payload.phone || !payload.serviceDescription) {
    return { error: "Missing required fields." };
  }

  if (!emailIsValid) {
    return { error: "Invalid email." };
  }

  return { payload };
}

async function googlePlacesFetch(path, options = {}) {
  if (!GOOGLE_PLACES_API_KEY) {
    throw new Error("Missing GOOGLE_PLACES_API_KEY");
  }

  const response = await fetch(`${GOOGLE_PLACES_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Places request failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

async function resolvePlaceId() {
  if (GOOGLE_PLACE_ID) {
    return GOOGLE_PLACE_ID;
  }

  if (!GOOGLE_BUSINESS_QUERY) {
    throw new Error("Missing GOOGLE_PLACE_ID or GOOGLE_BUSINESS_QUERY");
  }

  const data = await googlePlacesFetch("/places:searchText", {
    method: "POST",
    headers: {
      "X-Goog-FieldMask": "places.id",
    },
    body: JSON.stringify({
      textQuery: GOOGLE_BUSINESS_QUERY,
      maxResultCount: 1,
    }),
  });

  const placeId = data?.places?.[0]?.id;

  if (!placeId) {
    throw new Error("No Google Place found for the configured business query");
  }

  return placeId;
}

function normalizeGoogleReview(review, index) {
  return {
    id: review.name || `${review.authorAttribution?.displayName || "review"}-${index}`,
    author: review.authorAttribution?.displayName || "Google user",
    authorUri: review.authorAttribution?.uri || "",
    profilePhoto: review.authorAttribution?.photoUri || "",
    rating: Number(review.rating) || 0,
    relativeTime:
      review.relativePublishTimeDescription ||
      (review.publishTime ? new Date(review.publishTime).toLocaleDateString("en-US") : "Google review"),
    text:
      review.text?.text ||
      review.originalText?.text ||
      "Review text unavailable.",
  };
}

async function fetchGoogleReviews() {
  const now = Date.now();
  if (reviewsCache.payload && reviewsCache.expiresAt > now) {
    return reviewsCache.payload;
  }

  const placeId = await resolvePlaceId();
  const place = await googlePlacesFetch(`/places/${placeId}`, {
    headers: {
      "X-Goog-FieldMask":
        "id,displayName,rating,userRatingCount,reviews,googleMapsUri",
    },
  });

  const payload = {
    source: "google",
    placeId: place.id,
    businessName: place.displayName?.text || "Conexion Services",
    placeUrl: place.googleMapsUri || "",
    rating: Number(place.rating) || 0,
    totalReviews: Number(place.userRatingCount) || 0,
    reviews: Array.isArray(place.reviews)
      ? place.reviews.slice(0, GOOGLE_REVIEWS_LIMIT).map(normalizeGoogleReview)
      : [],
  };

  reviewsCache = {
    payload,
    expiresAt: now + REVIEWS_CACHE_TTL_MS,
  };

  return payload;
}

app.get("/", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/reviews", async (req, res) => {
  try {
    const payload = await fetchGoogleReviews();
    return res.status(200).json(payload);
  } catch (error) {
    console.error("Erro ao buscar reviews:", error);
    return res.status(200).json({
      source: "fallback",
      placeUrl: "",
      rating: 5,
      totalReviews: 0,
      reviews: [],
      message:
        "Configure GOOGLE_PLACES_API_KEY e GOOGLE_PLACE_ID ou GOOGLE_BUSINESS_QUERY para carregar reviews reais.",
    });
  }
});

app.post("/contact", async (req, res) => {
  const { payload, error } = validateContactPayload(req.body);

  if (error) {
    return res.status(400).json({ message: error });
  }

  const { name, email, phone, serviceDescription, area, propertyType, city, timeline } =
    payload;

  const logoUrl =
    process.env.EMAIL_LOGO_URL ||
    "https://res.cloudinary.com/dmdobsh3w/image/upload/v1774894340/logo_okiuy4.png";
  const formattedTimeline = formatTimeline(timeline);

  const mailOptions = {
    from: `"Conexion Services" <${EMAIL_FROM}>`,
    to: EMAIL_TO,
    replyTo: email || undefined,
    subject: `[New quote] Conexion Services - ${name}`,
    text: `New quote received:\n\nName: ${name}\nEmail: ${email || "N/A"}\nPhone: ${phone}\nArea: ${area ? area + " m2" : "N/A"}\nProperty type: ${propertyType || "N/A"}\nCity: ${city || "N/A"}\nPreferred timeline: ${formattedTimeline}\n\nService description:\n${serviceDescription}`,
    html: `
      <table width="100%" cellpadding="0" cellspacing="0" style="font-family:'Segoe UI',Arial,sans-serif;background:#081110;padding:24px;">
        <tr><td align="center" style="padding-bottom:18px;">
          <img src="cid:logo" alt="Conexion Services" style="height:60px;width:auto;" />
        </td></tr>
        <tr><td style="max-width:680px;margin:0 auto;background:linear-gradient(180deg,#0fa189 0%,#0b7464 100%);border-radius:16px;padding:22px;box-shadow:0 14px 32px rgba(0,0,0,0.32);color:#fdfefe;">
          <h2 style="margin:0 0 10px 0;font-size:22px;color:#ffffff;">New quote request</h2>
          <p style="margin:0 0 16px 0;color:rgba(255,255,255,0.9);font-size:14px;">A lead just arrived from the site form.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0c1f1e;border-radius:12px;padding:14px;border:1px solid rgba(122,232,215,0.25);">
            <tr><td style="padding:6px 0;color:#82ffe6;font-weight:800;">Name</td><td style="padding:6px 0;color:#fdfefe;">${name}</td></tr>
            <tr><td style="padding:6px 0;color:#82ffe6;font-weight:800;">Email</td><td style="padding:6px 0;color:#fdfefe;">${email || "N/A"}</td></tr>
            <tr><td style="padding:6px 0;color:#82ffe6;font-weight:800;">Phone</td><td style="padding:6px 0;color:#fdfefe;">${phone}</td></tr>
            <tr><td style="padding:6px 0;color:#82ffe6;font-weight:800;">Area</td><td style="padding:6px 0;color:#fdfefe;">${area ? area + " m2" : "N/A"}</td></tr>
            <tr><td style="padding:6px 0;color:#82ffe6;font-weight:800;">Property type</td><td style="padding:6px 0;color:#fdfefe;">${propertyType || "N/A"}</td></tr>
            <tr><td style="padding:6px 0;color:#82ffe6;font-weight:800;">City</td><td style="padding:6px 0;color:#fdfefe;">${city || "N/A"}</td></tr>
            <tr><td style="padding:6px 0;color:#82ffe6;font-weight:800;">Preferred timeline</td><td style="padding:6px 0;color:#fdfefe;">${formattedTimeline}</td></tr>
          </table>
          <div style="margin-top:16px;padding:16px;border:1px solid rgba(255,255,255,0.25);border-radius:12px;background:rgba(0,0,0,0.18);">
            <p style="margin:0 0 8px 0;font-weight:800;color:#ffffff;">Service description</p>
            <p style="margin:0;white-space:pre-wrap;line-height:1.6;color:#f4fbf9;">${serviceDescription}</p>
          </div>
        </td></tr>
        <tr><td align="center" style="padding-top:14px;color:#b6c6c3;font-size:12px;">
          Sent automatically by the Conexion Services site.
        </td></tr>
      </table>
    `,
    attachments: [
      {
        filename: logoUrl.split("/").pop() || "logo",
        path: logoUrl,
        cid: "logo",
      },
    ],
  };

  try {
    await transporter.sendMail(mailOptions);
    return res.status(200).json({ message: "Email enviado com sucesso" });
  } catch (err) {
    console.error("Erro ao enviar email:", err);
    return res.status(500).json({ message: "Erro ao enviar email" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
