import Reveal from "./ui/Reveal";

export default function Hook() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-14 text-center sm:py-32">
      <Reveal>
        <p className="readable-on-spiral font-heading text-xl font-semibold leading-snug sm:text-3xl md:text-4xl">
          Your name carries a number. Your birth date carries a pattern.
          Together they sketch
          <span className="text-accent-turquoise"> the map that's already running your life. </span>
          We just read it out loud.
        </p>
      </Reveal>
    </section>
  );
}
