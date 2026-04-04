import { createContext, useContext, useEffect, useState } from 'react';
import { apiRequest } from '../lib/apiClient';

const FeaturesContext = createContext({ r2: false, ai: false, email: false, push: false });

export const FeaturesProvider = ({ children }) => {
  const [features, setFeatures] = useState({ r2: false, ai: false, email: false, push: false });

  useEffect(() => {
    apiRequest('/features').then(setFeatures).catch(() => {});
  }, []);

  return <FeaturesContext.Provider value={features}>{children}</FeaturesContext.Provider>;
};

export const useFeatures = () => useContext(FeaturesContext);
