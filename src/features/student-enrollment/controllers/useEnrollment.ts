import { useState, useEffect, useCallback, useMemo } from 'react';
import { enrollmentService } from '../services/enrollmentService';
import { StudentRecord, BillingSummary, EnrollmentFilters } from '../models/enrollmentModels';

export const useEnrollment = () => {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [generatingDues, setGeneratingDues] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const [filters, setFilters] = useState<EnrollmentFilters>({
    searchQuery: '',
    levelFilter: 'all',
    transportOnly: false,
    canteenOnly: false,
    paymentStatus: 'all',
  });

  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await enrollmentService.getStudents();
      setStudents(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const triggerSyncFromArouaSchools = async () => {
    setSyncing(true);
    try {
      const newlySynced = await enrollmentService.syncIncomingBatchFromArouaSchools();
      setStudents(prev => [newlySynced, ...prev]);
      setNotification(`تم استقبال ومزامنة التلميذ(ة) بنجاح: ${newlySynced.full_name_ar} من منظومة أروى (arouaschools)`);
      setTimeout(() => setNotification(null), 5000);
      return newlySynced;
    } finally {
      setSyncing(false);
    }
  };

  const generateServiceDues = async (serviceType: 'transport' | 'canteen' | 'both') => {
    setGeneratingDues(true);
    try {
      const result = await enrollmentService.generateServiceDuesInCaisse(serviceType, filteredStudents);
      setNotification(`تم توليد ${result.addedCount} قيد استحقاق في يومية الصندوق بإجمالي ${result.totalGeneratedMAD.toLocaleString()} درهم`);
      setTimeout(() => setNotification(null), 6000);
    } finally {
      setGeneratingDues(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const filteredStudents = useMemo(() => {
    return students.filter(st => {
      // Search Query
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const matchesName = st.full_name_ar.toLowerCase().includes(q) || (st.full_name_fr && st.full_name_fr.toLowerCase().includes(q));
        const matchesId = st.student_id.toLowerCase().includes(q) || (st.external_id && st.external_id.toLowerCase().includes(q));
        const matchesMassar = st.massar_code.toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesMassar) return false;
      }

      // Transport Filter
      if (filters.transportOnly && !st.has_transport) return false;

      // Canteen Filter
      if (filters.canteenOnly && !st.has_canteen) return false;

      // Payment Status
      if (filters.paymentStatus === 'settled' && st.balance > 0) return false;
      if (filters.paymentStatus === 'pending' && st.balance <= 0) return false;

      // Level Filter
      if (filters.levelFilter !== 'all' && !st.academic_level.includes(filters.levelFilter)) return false;

      return true;
    });
  }, [students, filters]);

  const summary = useMemo<BillingSummary>(() => {
    return enrollmentService.calculateSummary(filteredStudents);
  }, [filteredStudents]);

  return {
    students: filteredStudents,
    rawCount: students.length,
    summary,
    loading,
    syncing,
    generatingDues,
    filters,
    setFilters,
    notification,
    refresh: loadStudents,
    triggerSyncFromArouaSchools,
    generateServiceDues,
  };
};
