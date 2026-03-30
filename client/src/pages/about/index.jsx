import styles from "./index.module.css";
import imgAbout from "./../../assets/img/imgAbout.webp";

const aboutParagraphs = [
  "We are specialized in flooring installation for residential and commercial projects, working with porcelain tile, ceramic, hardwood, vinyl, laminate, and other finishes with precision and consistency.",
  "With 4 years of experience in the industry, our team has built a reputation based on reliability, commitment, and attention to detail in every stage of the project.",
  "We proudly serve all of Florida, delivering guidance, timely execution, and clean results that reflect quality craftsmanship.",
];

const highlights = [
  { value: "4 years", label: "Industry experience" },
  { value: "Florida", label: "Projects across the state" },
];

export default function About() {
  return (
    <section className={styles.wrap_About} id="About">
      <div className={styles.about_content}>
        <div className={styles.about_intro}>
          <span className={styles.eyebrow}>About</span>
          <h3>Reliable flooring installation with clean execution.</h3>
          <p className={styles.lead}>
            Your space deserves the best, and we are here to make it happen.
          </p>
        </div>

        <div className={styles.about_body}>
          <div className={styles.about_points}>
            {highlights.map((item) => (
              <div key={item.value} className={styles.pointCard}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          <div className={styles.about_copy}>
            {aboutParagraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.about_visual}>
        <img
          className={styles.aboutImage}
          src={imgAbout}
          alt="Floor installation professional at work"
          loading="lazy"
          decoding="async"
        />
      </div>
    </section>
  );
}
