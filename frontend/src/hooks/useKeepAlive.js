import { useEffect, useRef } from "react";

// Use empty string for relative URLs (works with Vite proxy in dev, same-origin in prod)
const API_URL = import.meta.env.VITE_API_URL || "";
const PING_INTERVAL = 5 * 60 * 1000; // 5 minutes

export default function useKeepAlive() {
  const intervalRef = useRef(null);

  useEffect(() => {
    const pingBackend = async () => {
      try {
        const response = await fetch(`${API_URL}/api/health`);
        if (response.ok) {
          console.log("[KeepAlive] Backend pinged successfully");
        }
      } catch (error) {
        console.warn("[KeepAlive] Failed to ping backend:", error.message);
      }
    };

    pingBackend();

    intervalRef.current = setInterval(pingBackend, PING_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
}
