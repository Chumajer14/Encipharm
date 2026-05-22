function LoadingState({ label = "Cargando datos." }) {
  return (
    <section className="loading-state" role="status" aria-live="polite">
      <span className="loading-spinner" aria-hidden="true" />
      <span>{label}</span>
    </section>
  );
}

export default LoadingState;
