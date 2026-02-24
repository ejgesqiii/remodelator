type ProfileDefaultsSectionProps = {
  busy: boolean;
  isSessionReady: boolean;
  sessionEmail: string | null;
  profileFullName: string;
  profileRole: string;
  setProfileFullName: (value: string) => void;
  profileLaborRate: string;
  setProfileLaborRate: (value: string) => void;
  profileItemMarkupPct: string;
  setProfileItemMarkupPct: (value: string) => void;
  profileEstimateMarkupPct: string;
  setProfileEstimateMarkupPct: (value: string) => void;
  profileTaxRatePct: string;
  setProfileTaxRatePct: (value: string) => void;
  profileStatus: string;
  onLoadProfile: () => void;
  onSaveProfile: () => void;
};

export function ProfileDefaultsSection(props: ProfileDefaultsSectionProps) {
  return (
    <div className="stack">
      <h3>Profile Defaults</h3>
      {!props.isSessionReady && <div className="empty-state">Sign in to load and update profile defaults.</div>}
      {props.isSessionReady && (
        <>
          <div className="result-block">
            {props.sessionEmail ? `Signed in as ${props.sessionEmail} (${props.profileRole})` : `Session active (${props.profileRole})`}
          </div>
          <div className="inline-grid">
            <input value={props.profileFullName} onChange={(e) => props.setProfileFullName(e.target.value)} placeholder="Full name" />
            <input value={props.profileLaborRate} onChange={(e) => props.setProfileLaborRate(e.target.value)} placeholder="Labor rate" />
          </div>
          <div className="inline-grid">
            <input
              value={props.profileItemMarkupPct}
              onChange={(e) => props.setProfileItemMarkupPct(e.target.value)}
              placeholder="Default item markup %"
            />
            <input
              value={props.profileEstimateMarkupPct}
              onChange={(e) => props.setProfileEstimateMarkupPct(e.target.value)}
              placeholder="Default estimate markup %"
            />
          </div>
          <input value={props.profileTaxRatePct} onChange={(e) => props.setProfileTaxRatePct(e.target.value)} placeholder="Tax rate %" />
          <div className="toolbar">
            <button type="button" disabled={props.busy} onClick={props.onLoadProfile}>
              Reload Profile
            </button>
            <button type="button" disabled={props.busy} onClick={props.onSaveProfile}>
              Save Profile
            </button>
          </div>
          <div className="info-strip">{props.profileStatus || "Profile defaults are ready."}</div>
        </>
      )}
    </div>
  );
}
