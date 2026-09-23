import { useEffect, useState } from 'react';
import { getOwnerMode, setOwnerMode, checkOwnerModeParam } from '@/lib/ownerMode';

export function useOwnerMode() {
  const [ownerMode, setOwnerModeState] = useState(getOwnerMode);

  useEffect(() => {
    const paramValue = checkOwnerModeParam();
    if (paramValue !== null) {
      setOwnerMode(paramValue);
      setOwnerModeState(paramValue);
    }
  }, []);

  return ownerMode;
}
