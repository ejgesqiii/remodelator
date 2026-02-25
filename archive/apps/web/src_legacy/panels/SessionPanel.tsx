import { FormEvent } from "react";
import { ActivitySummary, AuditEntry } from "../types";
import { ActivityAuditSection } from "./session/ActivityAuditSection";
import { AuthFormsSection } from "./session/AuthFormsSection";
import { ProfileDefaultsSection } from "./session/ProfileDefaultsSection";
import { SnapshotSection } from "./session/SnapshotSection";

export type SessionPanelProps = {
  busy: boolean;
  sessionEmail: string | null;
  isSessionReady: boolean;

  registerEmail: string;
  setRegisterEmail: (value: string) => void;
  registerPassword: string;
  setRegisterPassword: (value: string) => void;
  registerName: string;
  setRegisterName: (value: string) => void;
  loginEmail: string;
  setLoginEmail: (value: string) => void;
  loginPassword: string;
  setLoginPassword: (value: string) => void;
  onRegister: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  onLogin: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  onLogout: () => void;

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

  activitySummary: ActivitySummary | null;
  auditTrail: AuditEntry[];
  onRefreshActivity: () => void;

  snapshotStatus: string;
  onExportSnapshot: () => void;
  onRestoreSnapshot: () => void;
};

export function SessionPanel(props: SessionPanelProps) {
  return (
    <section className="card">
      <h2>Session</h2>
      <p className="section-note">
        Create or resume a user session, then manage your default pricing profile and review recent activity.
      </p>
      <div className="two-col">
        <AuthFormsSection
          busy={props.busy}
          registerEmail={props.registerEmail}
          setRegisterEmail={props.setRegisterEmail}
          registerPassword={props.registerPassword}
          setRegisterPassword={props.setRegisterPassword}
          registerName={props.registerName}
          setRegisterName={props.setRegisterName}
          loginEmail={props.loginEmail}
          setLoginEmail={props.setLoginEmail}
          loginPassword={props.loginPassword}
          setLoginPassword={props.setLoginPassword}
          onRegister={props.onRegister}
          onLogin={props.onLogin}
          onLogout={props.onLogout}
        />

        <ProfileDefaultsSection
          busy={props.busy}
          isSessionReady={props.isSessionReady}
          sessionEmail={props.sessionEmail}
          profileFullName={props.profileFullName}
          profileRole={props.profileRole}
          setProfileFullName={props.setProfileFullName}
          profileLaborRate={props.profileLaborRate}
          setProfileLaborRate={props.setProfileLaborRate}
          profileItemMarkupPct={props.profileItemMarkupPct}
          setProfileItemMarkupPct={props.setProfileItemMarkupPct}
          profileEstimateMarkupPct={props.profileEstimateMarkupPct}
          setProfileEstimateMarkupPct={props.setProfileEstimateMarkupPct}
          profileTaxRatePct={props.profileTaxRatePct}
          setProfileTaxRatePct={props.setProfileTaxRatePct}
          profileStatus={props.profileStatus}
          onLoadProfile={props.onLoadProfile}
          onSaveProfile={props.onSaveProfile}
        />
      </div>

      <ActivityAuditSection
        busy={props.busy}
        isSessionReady={props.isSessionReady}
        activitySummary={props.activitySummary}
        auditTrail={props.auditTrail}
        onRefreshActivity={props.onRefreshActivity}
      />

      <SnapshotSection
        busy={props.busy}
        isSessionReady={props.isSessionReady}
        snapshotStatus={props.snapshotStatus}
        onExportSnapshot={props.onExportSnapshot}
        onRestoreSnapshot={props.onRestoreSnapshot}
      />
    </section>
  );
}
