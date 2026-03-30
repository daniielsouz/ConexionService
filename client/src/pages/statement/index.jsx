import { memo, useEffect, useRef, useState } from "react";
import styles from "./index.module.css";

const items = [
  { before: "/img/antes1.jpg", after: "/img/depois1.jpg" },
  { before: "/img/antes2.jpg", after: "/img/depois2.jpg" },
  { before: "/img/antes3.jpg", after: "/img/depois3.jpg" },
  { before: "/img/antes4.jpg", after: "/img/depois4.jpg" },
];

function BeforeAfter({ before, after, start = 50, height = 260 }) {
  const rootRef = useRef(null);
  const [pos, setPos] = useState(start);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let dragging = false;

    const setFromClientX = (clientX) => {
      const rect = root.getBoundingClientRect();
      const nextX = Math.min(Math.max(clientX - rect.left, 0), rect.width);
      setPos((nextX / rect.width) * 100);
    };

    const handleMouseDown = (event) => {
      dragging = true;
      setFromClientX(event.clientX);
    };

    const handleTouchStart = (event) => {
      dragging = true;
      setFromClientX(event.touches[0].clientX);
    };

    const handleMouseMove = (event) => {
      if (!dragging) return;
      setFromClientX(event.clientX);
    };

    const handleTouchMove = (event) => {
      if (!dragging) return;
      event.preventDefault();
      setFromClientX(event.touches[0].clientX);
    };

    const stopDragging = () => {
      dragging = false;
    };

    root.addEventListener("mousedown", handleMouseDown);
    root.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", stopDragging);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", stopDragging);

    return () => {
      root.removeEventListener("mousedown", handleMouseDown);
      root.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopDragging);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", stopDragging);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={styles.card}
      style={{ "--pos": `${pos}%`, "--h": `${height}px` }}
    >
      <img className={styles.after} src={after} alt="" loading="lazy" decoding="async" />
      <div
        className={styles.beforeClip}
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      >
        <img className={styles.before} src={before} alt="" loading="lazy" decoding="async" />
      </div>
      <div className={styles.handle} style={{ left: `${pos}%` }}>
        <span className={styles.bar} />
        <span className={styles.knob}>↔</span>
      </div>
      <span className={`${styles.label} ${styles.labelBefore}`}>BEFORE</span>
      <span className={`${styles.label} ${styles.labelAfter}`}>AFTER</span>
    </div>
  );
}

function Statement() {
  return (
    <section className={styles.section}>
      <div className={styles.sectionIntro}>
        <span className={styles.eyebrow}>Before & After</span>
        <h3 className={styles.sectionTitle}>
          See the difference in real project transformations.
        </h3>
        <p className={styles.sectionLead}>
          Drag each slider to compare the original space with the finished
          installation work.
        </p>
      </div>

      <div className={styles.grid}>
        {items.map((item) => (
          <div key={item.before} className={styles.cell}>
            <BeforeAfter after={item.after} before={item.before} start={50} height={260} />
          </div>
        ))}
      </div>
    </section>
  );
}

export default memo(Statement);
