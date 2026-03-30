import { memo, useEffect, useState } from "react";
import styles from "./index.module.css";
import facebookIcon from "/img/FacebookIcon.png";
import celIcon from "/img/celIcon.png";
import emailIcon from "/img/emailIcon.png";
import locationIcon from "/img/locationIcon.png";

function formatPhone(value) {
  let digits = value.replace(/\D/g, "");
  digits = digits.slice(0, 10);

  const area = digits.slice(0, 3);
  const first = digits.slice(3, 6);
  const last = digits.slice(6, 10);

  let formatted = "";

  if (area) {
    formatted = area.length < 3 ? `(${area}` : `(${area})`;
  }

  if (first) formatted += ` ${first}`;
  if (last) formatted += `-${last}`;

  return formatted;
}

function formatName(value) {
  return value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s]/g, "");
}

function isValidEmail(value) {
  const email = value.trim();
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const configuredApiBase = import.meta.env.VITE_API_URL?.replace(/\/$/, "");
const API_CONTACT_ENDPOINT = configuredApiBase
  ? `${configuredApiBase}/contact`
  : "/api/contact";

function formatArea(value) {
  const digits = value.replace(/[^\d]/g, "");
  return digits;
}

function formatPropertyType(value) {
  return value.replace(/\d+/g, "");
}

function formatServiceRequested(value) {
  return value.replace(/\d+/g, "");
}

function buildServiceDescription(serviceName) {
  return "";
}


function Footer() {
  const facebookUrl =
    "https://www.facebook.com/people/Conexion-Services-Corp/61573727235297/?mibextid=wwXIfr&rdid=fH9DmLbvnFj1k7ax&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F18G8qb5Kx6%2F%3Fmibextid%3DwwXIfr";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceRequested, setServiceRequested] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [area, setArea] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [city, setCity] = useState("");
  const [timeline, setTimeline] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState("");

  useEffect(() => {
    function handleServiceSelection(event) {
      const selectedService = event.detail?.serviceName;
      if (!selectedService) return;
      setServiceRequested(formatServiceRequested(selectedService));
      setServiceDescription(buildServiceDescription(selectedService));
      const formEl = document.querySelector("#form form");
      if (formEl) {
        formEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }

    window.addEventListener("quote-service-selected", handleServiceSelection);

    return () => {
      window.removeEventListener(
        "quote-service-selected",
        handleServiceSelection
      );
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    setStatusMessage("");
    setStatusType("");

    if (!isValidEmail(email)) {
      setStatusMessage("Please enter a valid email.");
      setStatusType("error");
      return;
    }

    setStatusMessage("Sending message...");
    setStatusType("loading");

    const data = {
      name,
      email: email.trim(),
      phone,
      serviceRequested,
      serviceDescription,
      area: area.trim(),
      propertyType: propertyType.trim(),
      city: city.trim(),
      timeline,
    };

    try {
      const response = await fetch(API_CONTACT_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setStatusMessage("Message sent successfully!");
        setStatusType("success");
        setName("");
        setEmail("");
        setPhone("");
        setServiceRequested("");
        setServiceDescription("");
        setArea("");
        setPropertyType("");
        setCity("");
        setTimeline("");
        return;
      }

      const errorPayload = await response.json().catch(() => ({}));
      setStatusMessage(errorPayload.error || "Failed to send message. Please check required fields.");
      setStatusType("error");
    } catch (error) {
      console.error(error);
      setStatusMessage("Connection error. Please try again later.");
      setStatusType("error");
    }
  }

  return (
    <footer id="form" className={styles.footer_Wrap}>
      <div className={styles.footer_infos}>
        <div className={styles.infoItem}>
          <a href={facebookUrl} target="_blank" rel="noreferrer">
            <img src={facebookIcon} alt="Facebook icon" loading="lazy" decoding="async" />
            @conexionservicescorp
          </a>
        </div>
        <div className={styles.infoItem}>
          <img src={celIcon} alt="Cell phone icon" loading="lazy" decoding="async" />
          <span>(904) 955-5850</span>
        </div>
        <div className={styles.infoItem}>
          <img src={emailIcon} alt="Email icon" loading="lazy" decoding="async" />
          <span>caue@conexionservicesfl.com</span>
        </div>
        <div className={`${styles.infoItem} ${styles.locationItem}`}>
          <div className={styles.locationHeader}>
            <img src={locationIcon} alt="Location icon" loading="lazy" decoding="async" />
            <span>Florida, USA</span>
          </div>
          <iframe
            className={styles.locationMap}
            title="Google Maps preview of Florida"
            src="https://www.google.com/maps?q=Florida,USA&z=6&output=embed"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>

      <div className={styles.footer_form}>
        <div className={styles.formIntro}>
          <span className={styles.eyebrow}>Contact</span>
          <h3>Talk to a flooring pro about your next project.</h3>
          <p className={styles.formLead}>
            Send the basics of your job and we will get back to you with the
            next steps.
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            required
            placeholder="Name:"
            value={name}
            onChange={(event) => setName(formatName(event.target.value))}
          />

          <input
            type="text"
            placeholder="Email (optional):"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <input
            type="text"
            required
            placeholder="Phone: (xxx) xxx-xxxx"
            value={phone}
            onChange={(event) => setPhone(formatPhone(event.target.value))}
          />

          <input
            type="text"
            placeholder="Service requested:"
            value={serviceRequested}
            onChange={(event) => setServiceRequested(formatServiceRequested(event.target.value))}
          />

          <div className={styles.inlineGrid}>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              placeholder="Approx. area (m²):"
              value={area}
              onChange={(event) => setArea(formatArea(event.target.value))}
            />
            <input
              type="text"
              placeholder="Property type (house, condo, commercial):"
              value={propertyType}
              onChange={(event) => setPropertyType(formatPropertyType(event.target.value))}
            />
          </div>

          <div className={styles.inlineGrid}>
            <input
              type="text"
              placeholder="City / location:"
              value={city}
              onChange={(event) => setCity(event.target.value)}
            />
          </div>

          <textarea
            required
            name="serviceDescription"
            id="serviceDescription"
            placeholder="Service Description:"
            value={serviceDescription}
            onChange={(event) => setServiceDescription(event.target.value)}
          />

          <button type="submit" disabled={statusType === "loading"}>
            {statusType === "loading" ? "Sending..." : "Submit"}
          </button>

          {statusMessage && (
            <p
              className={`${styles.statusMessage} ${
                statusType === "error"
                  ? styles.statusError
                  : statusType === "success"
                  ? styles.statusSuccess
                  : statusType === "loading"
                  ? styles.statusLoading
                  : ""
              }`}
            >
              {statusMessage}
            </p>
          )}
        </form>
      </div>
    </footer>
  );
}

export default memo(Footer);

