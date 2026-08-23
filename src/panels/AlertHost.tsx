import { useCallback } from "react";
import { useUIStore } from "../ui/uiStore";
import type { AlertKind } from "../ui/uiStore";

const KIND_MAP: Record<AlertKind, "brand" | "danger" | "info" | "success" | "warning"> = {
  info: "info",
  success: "success",
  warning: "warning",
  danger: "danger",
};

export function AlertHost() {
  const alerts = useUIStore((s) => s.alerts);
  const dismissAlert = useUIStore((s) => s.dismissAlert);

  const onDismiss = useCallback(
    (id: number) => () => dismissAlert(id),
    [dismissAlert],
  );

  return (
    <div className="alert-stack" aria-live="polite">
      {alerts.map((alert) => (
        <calcite-alert
          key={alert.id}
          open
          scale="s"
          kind={KIND_MAP[alert.kind]}
          icon
          label={alert.title}
        >
          <div slot="title">{alert.title}</div>
          {alert.message ? (
            <div slot="message">{alert.message}</div>
          ) : null}
          <calcite-action
            slot="actions-end"
            icon="x"
            scale="s"
            text="Dismiss notification"
            onClick={onDismiss(alert.id)}
          />
        </calcite-alert>
      ))}
    </div>
  );
}
