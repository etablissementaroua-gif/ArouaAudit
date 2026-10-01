import { PreInscriptionRecord } from '../models/preInscriptionModels';

const demoCandidates: PreInscriptionRecord[] = [];

export const preInscriptionService = {
  async getCandidates(): Promise<PreInscriptionRecord[]> {
    return demoCandidates;
  }
};
