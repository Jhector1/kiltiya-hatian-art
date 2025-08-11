"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { StyleState } from "../types";

export type DefsMap = Record<string, string>;

interface DesignContextValue {
  style: StyleState;
  setStyle: React.Dispatch<React.SetStateAction<StyleState>>;
  defsMap: DefsMap;
  setDefsMap: React.Dispatch<React.SetStateAction<DefsMap>>;
  handleStyleChange: <K extends keyof StyleState>(
    field: K,
    value: StyleState[K]
  ) => void;
}

const DesignContext = createContext<DesignContextValue | null>(null);
export function useDesignContext() {
  const ctx = useContext(DesignContext);
  if (!ctx) throw new Error("useDesignContext must be used within <DesignProvider>");
  return ctx;
}

export function DesignProvider({
  children,
  initialStyle,
}: {
  children: React.ReactNode;
  initialStyle: StyleState;
}) {
  const [style, setStyle] = useState<StyleState>(initialStyle);
  const [defsMap, setDefsMap] = useState<DefsMap>({});

  // PURE: only updates local state. No preview calls here.
  const handleStyleChange = useCallback(
    <K extends keyof StyleState>(field: K, value: StyleState[K]) => {
      setStyle((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const value = useMemo(
    () => ({ style, setStyle, defsMap, setDefsMap, handleStyleChange }),
    [style, defsMap, handleStyleChange]
  );

  return <DesignContext.Provider value={value}>{children}</DesignContext.Provider>;
}
