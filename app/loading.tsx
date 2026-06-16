export default function Loading() {
  return (
    <main className="route-loading" aria-label="Loading page">
      <div className="route-loading-glass glass-panel" role="status">
        <div className="route-loading-orbit" aria-hidden="true">
          <span className="route-loading-mark">P</span>
          <i />
          <i />
          <i />
        </div>
        <div className="route-loading-copy">
          <strong>Loading Module</strong>
          <span>Preparing</span>
        </div>
        <div className="route-loading-track" aria-hidden="true">
          <span />
        </div>
      </div>
    </main>
  );
}
