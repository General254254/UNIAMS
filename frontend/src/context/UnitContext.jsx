import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const UnitContext = createContext(null);

export function UnitProvider({ children }) {
  const { user } = useAuth();
  const [units, setUnits] = useState([]);
  const [activeUnit, setActiveUnit] = useState(null);
  const [loadingUnits, setLoadingUnits] = useState(false);

  const fetchUnits = () => {
    if (!user) {
      setUnits([]);
      setActiveUnit(null);
      return;
    }
    setLoadingUnits(true);
    api.get('/units/')
      .then(({ data }) => {
        setUnits(data);
        if (data.length > 0) {
          setActiveUnit(prev => prev ?? data[0]);
        } else {
          setActiveUnit(null);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingUnits(false));
  };

  useEffect(() => {
    fetchUnits();
  }, [user]);

  const refreshUnits = () => {
    fetchUnits();
  };

  return (
    <UnitContext.Provider value={{ units, activeUnit, setActiveUnit, loadingUnits, refreshUnits }}>
      {children}
    </UnitContext.Provider>
  );
}

export const useUnit = () => useContext(UnitContext);
