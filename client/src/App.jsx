import { Suspense, lazy } from "react";
import Nav from "./pages/components/nav";
import Carousel from "./pages/components/carousel";
import About from "./pages/about";

const Services = lazy(() => import("./pages/services"));
const Statement = lazy(() => import("./pages/statement"));
const Footer = lazy(() => import("./pages/components/footer"));

const carouselItems = [
  { src: "/img/1.png", alt: "Slide 1" },
  { src: "/img/2.png", alt: "Slide 2" },
  { src: "/img/3.png", alt: "Slide 3" },
  { src: "/img/4.png", alt: "Slide 4" },
  { src: "/img/5.png", alt: "Slide 5" },
  { src: "/img/6.png", alt: "Slide 6" },
  { src: "/img/7.png", alt: "Slide 7" },
];

function SectionFallback() {
  return <div style={{ minHeight: "20vh", backgroundColor: "#000" }} />;
}

function App() {
  return (
    <>
      <Nav />
      <Carousel items={carouselItems} />
      <About />
      <Suspense fallback={<SectionFallback />}>
        <Services />
        <Statement />
        <Footer />
      </Suspense>
    </>
  );
}

export default App;
