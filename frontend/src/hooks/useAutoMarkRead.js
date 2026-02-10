import { useEffect } from 'react';
const API_URL = import.meta.env.VITE_API_URL;

export default function useAutoMarkRead(linkPattern) {
  useEffect(() => {
    if (!linkPattern) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    const timer = setTimeout(async () => {
      try {
        await fetch(`${API_URL}/api/notifications/mark-read-by-link`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ linkPattern })
        });
      } catch (err) {
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [linkPattern]);
}
