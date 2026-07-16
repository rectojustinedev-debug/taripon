export function Logo({
  withText = true,
  size = "md",
}: {
  withText?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const box = size === "lg" ? "h-11 w-11" : size === "sm" ? "h-8 w-8" : "h-9 w-9";
  const text = size === "lg" ? "text-xl" : size === "sm" ? "text-sm" : "text-lg";
  return (
    <div className="flex items-center gap-2.5">
      <div className={`${box} shrink-0 overflow-hidden rounded-xl shadow-sm ring-1 ring-black/5`}>
        <img src="/logo.png" alt="TARIPON" className="h-full w-full object-cover" />
      </div>
      {withText && (
        <span className={`${text} font-bold tracking-tight text-foreground`}>TARIPON</span>
      )}
    </div>
  );
}
