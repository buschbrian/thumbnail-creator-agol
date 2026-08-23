import { useEffect } from "react";
import { useEditorStore } from "../state/store";

function isTypingTarget(event: KeyboardEvent): boolean {
  return event
    .composedPath()
    .some((node) => {
      if (!(node instanceof HTMLElement)) return false;
      return (
        node.tagName === "INPUT" ||
        node.tagName === "TEXTAREA" ||
        node.tagName === "SELECT" ||
        node.isContentEditable
      );
    });
}

export function useKeyboardShortcuts(): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      const store = useEditorStore.getState();
      const mod = event.ctrlKey || event.metaKey;

      if (mod && event.key.toLowerCase() === "z") {
        if (isTypingTarget(event)) return;
        event.preventDefault();
        const temporal = useEditorStore.temporal.getState();
        if (event.shiftKey) temporal.redo();
        else temporal.undo();
        return;
      }

      if (mod && event.key.toLowerCase() === "y") {
        if (isTypingTarget(event)) return;
        event.preventDefault();
        useEditorStore.temporal.getState().redo();
        return;
      }

      if ((event.key === "Delete" || event.key === "Backspace") && !isTypingTarget(event)) {
        if (store.selectedId) {
          event.preventDefault();
          store.removeLayer(store.selectedId);
        }
        return;
      }

      if (event.key === "Escape") {
        store.select(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
