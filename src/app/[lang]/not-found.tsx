import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <p
        className="mb-2 text-xs uppercase tracking-wider"
        style={{
          color: "var(--color-ink-mute)",
          letterSpacing: "0.08em",
          fontFamily: "var(--font-sans)",
        }}
      >
        404
      </p>
      <h1 className="mb-4 text-2xl" style={{ fontWeight: 600 }}>
        Not found
      </h1>
      <p className="mb-6" style={{ color: "var(--color-ink-soft)" }}>
        The page or indicator you requested does not exist in the catalogue.
      </p>
      <Link href="/">Return to home</Link>
    </div>
  );
}
