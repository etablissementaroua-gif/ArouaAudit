import { useState, useEffect, useCallback } from 'react';
import { systemSettingsService } from '../services/systemSettings.service';
import { AcademicYear, EducationalCycle, AcademicLevelClass, LevelTarif } from '../models/settings.types';

export const useSystemSettings = (academicYear = '2026/2027') => {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [cycles, setCycles] = useState<EducationalCycle[]>([]);
  const [levels, setLevels] = useState<AcademicLevelClass[]>([]);
  const [tarifs, setTarifs] = useState<LevelTarif[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [y, cyc, lvl, tar] = await Promise.all([
        systemSettingsService.getAcademicYears(),
        systemSettingsService.getEducationalCycles(),
        systemSettingsService.getLevelsAndClasses(),
        systemSettingsService.getLevelTarifs(academicYear)
      ]);
      setYears(y);
      setCycles(cyc);
      setLevels(lvl);
      setTarifs(tar);
    } catch (err) {
      console.warn('[useSystemSettings] Load error:', err);
    } finally {
      setLoading(false);
    }
  }, [academicYear]);

  useEffect(() => { load(); }, [load]);

  const setActiveYear = useCallback(async (code: string) => {
    await systemSettingsService.setActiveAcademicYear(code);
    await load();
  }, [load]);

  const updateTarif = useCallback(async (levelCode: string, data: Partial<LevelTarif>) => {
    await systemSettingsService.updateLevelTarif(levelCode, data, academicYear);
    await load();
  }, [academicYear, load]);

  return { years, cycles, levels, tarifs, loading, refresh: load, setActiveYear, updateTarif };
};