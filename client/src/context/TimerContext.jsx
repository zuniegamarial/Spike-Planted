import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/axios';
import { useAuth } from './AuthContext';

const TimerContext = createContext(null);

export function TimerProvider({ children }) {
  const { user } = useAuth();
  const [activeSession, setActiveSession] = useState(null);

  const fetchActiveSession = async () => {
    if (user?.role !== 'student') return;
    try {
      const { data } = await api.get('/ojt/my-attendance');
      const active = data.attendance?.find(r => r.timeOut === null);
      setActiveSession(active ? active.timeIn : null);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchActiveSession();
  }, [user]);

  return (
    <TimerContext.Provider value={{ activeSession, fetchActiveSession }}>
      {children}
    </TimerContext.Provider>
  );
}

export const useTimer = () => useContext(TimerContext);