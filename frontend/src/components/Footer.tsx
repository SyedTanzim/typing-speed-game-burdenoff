export function Footer() {
  const year = new Date().getFullYear();
  const githubUrl = "https://github.com/SyedTanzim/typing-speed-game-burdenoff";

  return (
    <footer
      id="about"
      className="border-t border-violet-200 mt-3 px-4 md:px-8 py-6 max-w-5xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-sm"
    >
      <p className="m-0">© {year} Syed Tanzim Wajih. All rights reserved.</p>
      <a
        className="inline-flex items-center gap-1.5 text-slate-500 no-underline hover:text-violet-600 transition-colors"
        href={githubUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        <svg
          className="w-4.5 h-4.5 fill-current"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12 0C5.37 0 0 5.5 0 12.3c0 5.44 3.44 10.05 8.21 11.68.6.12.82-.27.82-.6 0-.3-.01-1.08-.02-2.12-3.34.75-4.04-1.65-4.04-1.65-.55-1.42-1.34-1.8-1.34-1.8-1.1-.77.08-.76.08-.76 1.21.09 1.85 1.27 1.85 1.27 1.08 1.9 2.83 1.35 3.52 1.03.11-.8.42-1.35.76-1.66-2.67-.31-5.47-1.38-5.47-6.13 0-1.35.47-2.46 1.24-3.32-.12-.31-.54-1.57.12-3.28 0 0 1.01-.33 3.3 1.27a11.2 11.2 0 0 1 6 0c2.29-1.6 3.3-1.27 3.3-1.27.66 1.71.24 2.97.12 3.28.77.86 1.24 1.97 1.24 3.32 0 4.76-2.81 5.81-5.49 6.12.43.38.81 1.13.81 2.28 0 1.65-.02 2.98-.02 3.38 0 .33.22.72.83.6C20.57 22.34 24 17.74 24 12.3 24 5.5 18.63 0 12 0Z" />
        </svg>
        <span>GitHub</span>
      </a>
    </footer>
  );
}