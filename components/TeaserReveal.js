import Card from "./ui/Card";
import PointIcon from "./PointIcon";

export default function TeaserReveal({ firstName, points }) {
  const featured = points.filter((p) => p.featured);
  const rest = points.filter((p) => !p.featured);

  return (
    <div className="mx-auto mt-16 max-w-4xl">
      <p className="text-center font-heading text-sm uppercase tracking-[0.3em] text-accent-turquoise">
        {firstName ? `${firstName}'s` : "Your"} blueprint
      </p>

      {/* 4 избранных пункта — раскрыты полностью, с иконкой и текстом-крючком */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {featured.map((p) => (
          <Card key={p.code} glow>
            <div className="flex items-start gap-3">
              <span className="text-accent-turquoise">
                <PointIcon code={p.code} size={26} />
              </span>
              <div>
                <span className="font-heading text-sm font-semibold">
                  {p.label}
                </span>
                <p className="mt-1 text-sm text-foreground-muted">{p.phrase}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Остальные посчитанные пункты — значение видно, толкование в полном разборе */}
      {rest.length > 0 && (
        <>
          <p className="mt-10 text-center text-sm text-foreground-muted">
            We calculated the rest of your chart too — here&apos;s what came
            back. The full interpretation of each is in your complete reading.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((p) => (
              <div
                key={p.code}
                className="flex items-center gap-3 rounded-xl border border-foreground-muted/20 bg-background-alt/40 px-4 py-3"
              >
                <span className="text-foreground-muted">
                  <PointIcon code={p.code} size={22} />
                </span>
                <span className="text-sm text-foreground">{p.label}</span>
              </div>
            ))}
          </div>
        </>
      )}

    </div>
  );
}
