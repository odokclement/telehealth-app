import { useContext } from "react";
import { StreamContext } from "../components/StreamContext";

export function useStream() {
  const context = useContext(StreamContext);
  if (!context) {
    throw new Error("use stream must be used within a stream provider");
  }

  return context;
}