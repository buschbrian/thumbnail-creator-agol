import { useEffect, useState } from "react";
import { useEditorStore } from "../state/store";

interface HistoryFlags {
  canUndo: boolean;
  canRedo: boolean;
}

export function useHistoryFlags(): HistoryFlags {
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsubscribe = useEditorStore.temporal.subscribe(() =>
      setTick((tick) => tick + 1),
    );
    return unsubscribe;
  }, []);

  const temporal = useEditorStore.temporal.getState();
  return {
    canUndo: temporal.pastStates.length > 0,
    canRedo: temporal.futureStates.length > 0,
  };
}
