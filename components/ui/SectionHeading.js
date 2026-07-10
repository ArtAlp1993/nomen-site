export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  className = "",
}) {
  const alignment = align === "left" ? "text-left items-start" : "text-center items-center";

  return (
    <div className={`flex flex-col gap-4 ${alignment} ${className}`}>
      {eyebrow && (
        <span className="font-heading text-xs uppercase tracking-[0.3em] text-accent-turquoise">
          {eyebrow}
        </span>
      )}
      <h2 className="readable-on-spiral font-heading text-2xl font-semibold sm:text-4xl md:text-5xl">
        {title}
      </h2>
      {subtitle && (
        <p className="readable-on-spiral max-w-2xl text-sm text-foreground-muted sm:text-lg">
          {subtitle}
        </p>
      )}
    </div>
  );
}
