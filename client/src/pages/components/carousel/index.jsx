import { memo } from "react";
import styles from "./index.module.css";

function InfiniteCarousel({
  items = [],
  speedMs = 50000,
  gap = "16px",
  height = "240px",
  pauseOnHover = true,
}) {
  const loopItems = [...items, ...items];

  return (
    <section
      className={`${styles.carousel} ${
        pauseOnHover ? styles.pauseOnHover : ""
      }`}
      style={{ "--gap": gap, "--height": height, "--duration": `${speedMs}ms` }}
      aria-roledescription="carousel"
    >
      <div className={styles.viewport}>
        <div className={styles.track}>
          {loopItems.map((item, i) => (
            <div className={styles.slide} key={`${item.src}-${i}`}>
              <img
                src={item.src}
                alt={item.alt ?? `Slide ${i + 1}`}
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : "auto"}
                decoding="async"
                draggable="false"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default memo(InfiniteCarousel);
