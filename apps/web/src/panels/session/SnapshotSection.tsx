type SnapshotSectionProps = {
  busy: boolean;
  isSessionReady: boolean;
  snapshotStatus: string;
  onExportSnapshot: () => void;
  onRestoreSnapshot: () => void;
};

export function SnapshotSection(props: SnapshotSectionProps) {
  return (
    <div className="section-split">
      <h3>Data Snapshot</h3>
      <p className="section-note">Export a local backup snapshot and restore it during demo review without CLI.</p>
      <div className="toolbar">
        <button type="button" disabled={props.busy || !props.isSessionReady} onClick={props.onExportSnapshot}>
          Export Snapshot
        </button>
        <button type="button" disabled={props.busy || !props.isSessionReady} onClick={props.onRestoreSnapshot}>
          Restore Last Snapshot
        </button>
      </div>
      <div className="info-strip">{props.snapshotStatus || "No snapshot exported yet."}</div>
    </div>
  );
}
