import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type UserRole = 'patient' | 'doctor' | 'pharmacist' | 'lab_admin' | 'admin' | 'clinic';

export const useUserRole = () => {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    const fetchRole = async () => {
      // Check for roles in priority order
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (roles && roles.length > 0) {
        // Priority: admin > doctor > pharmacist > lab_admin > patient
        const roleOrder: UserRole[] = ['admin', 'doctor', 'pharmacist', 'lab_admin', 'patient'];
        const userRoles = roles.map(r => r.role as UserRole);
        
        for (const r of roleOrder) {
          if (userRoles.includes(r)) {
            setRole(r);
            break;
          }
        }
      } else {
        // Check if user has a clinic (clinic owner)
        const { data: clinic } = await supabase
          .from('clinics')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (clinic) {
          setRole('clinic');
        } else {
          setRole('patient');
        }
      }

      setLoading(false);
    };

    fetchRole();
  }, [user, authLoading]);

  const getDashboardRoute = (): string => {
    switch (role) {
      case 'admin':
        return '/admin';
      case 'doctor':
        return '/doctor-dashboard';
      case 'pharmacist':
        return '/pharmacy-dashboard';
      case 'lab_admin':
        return '/lab-dashboard';
      case 'clinic':
        return '/clinic-dashboard';
      case 'patient':
      default:
        return '/dashboard';
    }
  };

  const getRoleName = (): string => {
    switch (role) {
      case 'admin':
        return 'مسؤول';
      case 'doctor':
        return 'طبيب';
      case 'pharmacist':
        return 'صيدلي';
      case 'lab_admin':
        return 'مخبر';
      case 'clinic':
        return 'عيادة';
      case 'patient':
      default:
        return 'مريض';
    }
  };

  return { role, loading, getDashboardRoute, getRoleName };
};
