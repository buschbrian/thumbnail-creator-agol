import { useUIStore } from "../ui/uiStore";
import { useDomEvents } from "../hooks/useDomEvents";
import type { AlertItem } from "../ui/uiStore";

function Toast({ alert }: { alert: AlertItem }) {
  const dismissAlert = useUIStore((s) => s.dismissAlert);
  const ref = useDomEvents([["calciteAlertClose", () => dismissAlert(alert.id)]]);

  return (
    <calcite-alert
      ref={ref}
      open
      scale="s"
      kind={alert.kind}
      icon
      label={alert.title}
    >
      <div slot="title">{alert.title}</div>
      {alert.message ? <div slot="message">{alert.message}</div> : null}
    </calcite-alert>
  );
}

export function AlertHost() {
  const alerts = useUIStore((s) => s.alerts);
  return (
    <div className="alert-stack" aria-live="polite">
      {alerts.map((alert) => (
        <Toast key={alert.id} alert={alert} />
      ))}
    </div>
  );
}
