import Image from "next/image";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-2.5 px-4 py-6 text-center">
        <p className="text-xs text-slate-500">
          תודה לברכה לנג · LinkUp · על שיתוף הוורקפלואו
        </p>
        <a
          href="https://ready-systems.dev"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="פיתוח אתרים ומערכות על ידי Ready Systems"
          className="group inline-flex items-center gap-2 text-[11px] font-light tracking-wide text-slate-400 transition hover:text-slate-700"
        >
          <span>פיתוח אתרים ומערכות ·</span>
          <Image
            src="/ready-systems-logo.png"
            alt="Ready Systems"
            width={20}
            height={20}
            className="opacity-70 transition group-hover:scale-110 group-hover:opacity-100"
          />
          <span>ready-systems</span>
        </a>
      </div>
    </footer>
  );
}
