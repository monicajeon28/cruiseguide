'use client';

import { ReactNode } from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import AccessCheckWrapper from '@/components/AccessCheckWrapper';
import AnalyticsTracker from '@/components/AnalyticsTracker';
import SecurityProtection from '@/components/SecurityProtection';

/**
 * 클라이언트 프로바이더
 * 작업자 C (UX/기능 전문가) - 에러 핸들링
 */

export default function Providers({ children }: { children: ReactNode }) {
  const { toasts, removeToast } = useToast();

  return (
    <ErrorBoundary>
      <SecurityProtection />
      <AccessCheckWrapper>
        {children}
      </AccessCheckWrapper>
      <AnalyticsTracker />
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ErrorBoundary>
  );
}

