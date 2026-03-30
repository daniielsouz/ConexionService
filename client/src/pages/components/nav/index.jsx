import logo from "./../../../assets/img/logo.png";
import celIcon from "/img/celIcon.png";
import style from "./index.module.css";

const links = [
  { name: "About", to: "#About" },
  { name: "Services", to: "#Services" },
  { name: "Contact", to: "#form" },
];

export default function Nav() {
  function handleNavClick(e, to) {
    if (to.startsWith("#")) {
      e.preventDefault();
      const el = document.querySelector(to);
      if (el) {
        const targetY = el.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({
          top: targetY,
          behavior: "smooth",
        });
      }
    }
  }

  return (
    <header className={style.header}>
      <div className={style.wrap_Icon}>
        <img src={logo} alt="Company logo" />
        <span>Conexion Services</span>
      </div>
      <div className={style.wrap_inf}>
        <nav className={style.wrap_Nav}>
          <ul>
            {links.map((item) => (
              <li key={item.name}>
                <a href={item.to} onClick={(e) => handleNavClick(e, item.to)}>
                  {item.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className={style.wrap_Contact}>
          <a href="tel:+19049555850" title="Call Conexion Services">
            <img src={celIcon} alt="" aria-hidden="true" />
            (904) 955-5850
          </a>
        </div>
      </div>
    </header>
  );
}
