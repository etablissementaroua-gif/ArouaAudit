import { useState, useEffect } from 'react';
import { enrollmentService } from '../services/enrollmentService';
import { StudentEnrollment } from '../models/enrollmentModels';

export const useEnrollment = () => {
  const [students, setStudents] = useState<StudentEnrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    enrollmentService.getEnrollments().then(data => {
      setStudents(data);
      setLoading(false);
    });
  }, []);

  return { students, loading };
};
