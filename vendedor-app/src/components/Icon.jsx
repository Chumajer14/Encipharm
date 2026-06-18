const ICON_PATHS = {
  add: ["M12 5v14m-7-7h14"],
  arrow: ["M5 12h14m-6-6 6 6-6 6"],
  chart: ["M4 19V5m0 14h16M8 15l3-3 3 2 4-7"],
  check: ["M20 6 9 17l-5-5"],
  close: ["M6 6l12 12M18 6 6 18"],
  forecast: ["M4 17l5-5 4 4 7-9", "M14 7h6v6"],
  home: ["M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-8z"],
  pipeline: ["M4 5h16l-6 7v5l-4 2v-7L4 5z"],
  settings: [
    "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z",
    "M19.4 15a1.7 1.7 0 0 0 .34 1.87l.04.04a2 2 0 1 1-2.83 2.83l-.04-.04A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21a2 2 0 1 1-4 0v-.06A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.87.34l-.04.04a2 2 0 1 1-2.83-2.83l.04-.04A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3a2 2 0 1 1 0-4h.06A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.87l-.04-.04a2 2 0 1 1 2.83-2.83l.04.04A1.7 1.7 0 0 0 9 4.6c.38-.15.7-.36 1-.6.3-.27.45-.67.45-1.1V3a2 2 0 1 1 4 0v.06A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.87-.34l.04-.04a2 2 0 1 1 2.83 2.83l-.04.04A1.7 1.7 0 0 0 19.4 9c.15.38.36.7.6 1 .27.3.67.45 1.1.45H21a2 2 0 1 1 0 4h-.06A1.7 1.7 0 0 0 19.4 15z",
  ],
  spark: ["M12 3l1.8 5.1L19 10l-5.2 1.9L12 17l-1.8-5.1L5 10l5.2-1.9L12 3z", "M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z"],
  sync: ["M20 7h-6a4 4 0 0 0-4 4v1", "M4 17h6a4 4 0 0 0 4-4v-1", "M17 4l3 3-3 3", "M7 20l-3-3 3-3"],
  user: ["M20 21a8 8 0 0 0-16 0", "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"],
};

function Icon({ name, size = 20 }) {
  const paths = ICON_PATHS[name] || ICON_PATHS.home;

  return (
    <svg
      aria-hidden="true"
      className="app-icon"
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width={size}
    >
      {paths.map((path) => <path d={path} key={path} />)}
    </svg>
  );
}

export default Icon;
