import { useState, useEffect } from 'react';
import { preInscriptionService } from '../services/preInscriptionService';
import { PreInscriptionRecord } from '../models/preInscriptionModels';

export const usePreInscription = () => {
  const [candidates, setCandidates] = useState<PreInscriptionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    preInscriptionService.getCandidates().then(data => {
      setCandidates(data);
      setLoading(false);
    });
  }, []);

  return { candidates, loading };
};
