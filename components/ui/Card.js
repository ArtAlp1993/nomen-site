export default function Card({ children, className = "", glow = false }) {
  return (
    <div
      className={`rounded-2xl border border-foreground-muted/20 bg-background-alt/60 p-6 backdrop-blur-sm ${
        glow ? "glow-violet" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
