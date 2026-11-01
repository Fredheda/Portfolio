import FredbotPanel from '../components/FredbotPanel';
import Experience from '../components/home/Experience';
import Hero from '../components/home/Hero';
import Projects from '../components/home/Projects';
import { useHashScroll } from '../lib/useHashScroll';

export default function Home() {
  useHashScroll();
  return (
    <>
      <Hero />
      <Experience />
      {/* Posts section hidden until the owner supplies posts: <Posts /> from ../components/home/Posts */}
      <Projects />
      <FredbotPanel />
    </>
  );
}
