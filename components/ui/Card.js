export default function Card({ children, className = "", glow = false }) {
  return (
    <div
      className={`rounded-2xl border border-foreground-muted/20 bg-background-alt/75 p-6 backdrop-blur-md transition-all duration-500 ease-out hover:-translate-y-1 hover:border-accent-turquoise/50 hover:shadow-[0_22px_50px_-30px_rgba(51,230,224,0.5)] ${
        glow ? "glow-violet" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
