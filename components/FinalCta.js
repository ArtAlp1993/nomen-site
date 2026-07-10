import Button from "./ui/Button";
import Reveal from "./ui/Reveal";

export default function FinalCta() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-24 text-center sm:py-32">
      <Reveal>
        <h2 className="font-heading text-3xl font-semibold sm:text-4xl">
          You already have the code.
          <br />
          <span className="bg-gradient-to-r from-accent-violet to-accent-turquoise bg-clip-text text-transparent">
            Let's read it.
          </span>
        </h2>
        <div className="mt-8">
          <Button href="#quiz">Reveal my blueprint</Button>
        </div>
      </Reveal>
    </section>
  );
}
