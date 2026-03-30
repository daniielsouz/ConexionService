import { memo, useEffect, useRef, useState } from "react";
import styles from "./index.module.css";
import iconVinyl from "./../../assets/img/1.png";
import iconLaminate from "./../../assets/img/2.png";
import iconHardwood from "./../../assets/img/3.png";
import iconLtv from "./../../assets/img/4.png";
import iconFloor from "./../../assets/img/5.png";
import iconFlooring from "./../../assets/img/6.png";
import iconKitchen from "./../../assets/img/7.png";
import iconWall from "./../../assets/img/8.png";
import iconBathroom from "./../../assets/img/9.png";

const services = [
  {
    name: "Vinyl Plank Installation",
    description: "Fast, clean, and moisture-resistant.",
    icon: iconVinyl,
    subtitle: "(Showers & Full Bathrooms)",
  },
  {
    name: "Laminate Flooring Installation",
    description: "Wood look, great value, durable.",
    icon: iconLaminate,
  },
  {
    name: "Glue-Down Hardwood",
    description: "Premium natural wood, stable install.",
    icon: iconHardwood,
  },
  {
    name: "Glue-Down Vinyl",
    description: "Commercial-grade, piece-by-piece precision.",
    icon: iconLtv,
    subtitle: "(Showers & Full Bathrooms)",
  },
  {
    name: "Floor Removal & Demolition",
    description: "Safe removal, dust control, proper disposal.",
    icon: iconFloor,
  },
  {
    name: "Tile Flooring",
    description: "Planned layout, level surfaces, clean grout.",
    icon: iconFlooring,
    subtitle: "(Ceramic/Porcelain)",
  },
  {
    name: "Kitchen Backsplash",
    description: "Clean cuts and neat edge trims.",
    icon: iconKitchen,
  },
  {
    name: "Wall Tile Installation",
    description: "Plumb, level, precise cuts and niches.",
    icon: iconWall,
  },
  {
    name: "Bathroom Tiling",
    description:
      "Waterproofing, proper slope to drain, floor & wall tile, niches, thresholds, grout and sealing.",
    icon: iconBathroom,
    subtitle: "(Showers & Full Bathrooms)",
  },
];

function Counter({ target = 300, durationMs = 1500, on }) {
  const [value, setValue] = useState(0);
  const rafRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    if (!on) return;
    cancelAnimationFrame(rafRef.current);
    startRef.current = null;

    const step = (ts) => {
      if (!startRef.current) startRef.current = ts;
      const progress = Math.min((ts - startRef.current) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
        return;
      }

      setValue(target);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [on, target, durationMs]);

  return <span className={`${styles.value} ${styles.textStat}`}>{value}</span>;
}

function Services() {
  const statsRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [fired, setFired] = useState(false);

  useEffect(() => {
    const element = statsRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !fired) {
            setVisible(true);
            setFired(true);
          }
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [fired]);

  function handleScrollToForm(event, serviceName) {
    event.preventDefault();
    window.dispatchEvent(
      new CustomEvent("quote-service-selected", {
        detail: { serviceName },
      })
    );
    const element = document.getElementById("form");
    if (element) element.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section id="Services" className={styles.section_service}>
      <div className={styles.sectionIntro}>
        <span className={styles.eyebrow}>Services</span>
        <h3 className={styles.service_title}>
          Installation services for every type of project.
        </h3>
        <p className={styles.serviceLead}>
          Explore the core services we offer for residential and commercial
          flooring work.
        </p>
      </div>

      <div className={styles.wrap_AllServices}>
        {services.map((service) => (
          <div key={service.name} className={styles.wrap_service}>
            <div className={styles.servicesName}>
              <img src={service.icon} alt="" loading="lazy" decoding="async" />
              <h2>
                {service.name}
                {service.subtitle && <p>{service.subtitle}</p>}
              </h2>
            </div>
            <div className={styles.servicesDescription}>
              <span>{service.description}</span>
            </div>
            <div className={styles.servicesLink}>
              <a
                href="#form"
                onClick={(event) => handleScrollToForm(event, service.name)}
              >
                Get a quote
              </a>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-arrow-right-icon lucide-arrow-right"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </div>
          </div>
        ))}
      </div>

      <div ref={statsRef} className={styles.stats}>
        <div className={styles.stat}>
          <span className={`${styles.prefix} ${styles.textStat}`}>+</span>
          <Counter target={800} durationMs={2000} on={visible} />
          <span className={`${styles.label} ${styles.textStat}`}>
            Customers
          </span>
        </div>
      </div>
    </section>
  );
}

export default memo(Services);
