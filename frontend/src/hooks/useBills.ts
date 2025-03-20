import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/components/Toast';
import { fetchAPI } from '@/lib/api';
import { Bill } from '@/lib/types';
import { handleQueryError } from '@/lib/api';

export function useBills(familyId?: string | number) {
    const [bills, setBills] = useState<Bill[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const { showToast } = useToast();
    const requestAttempted = useRef(false);
    const hasError = useRef(false);

    useEffect(() => {
        if (familyId) {
            requestAttempted.current = false;
            hasError.current = false;
        }

        const fetchBills = async () => {
            if (!familyId) {
                setBills([]);
                setIsLoading(false);
                return;
            }

            if (requestAttempted.current && hasError.current) {
                return;
            }

            try {
                setIsLoading(true);
                requestAttempted.current = true;

                const response = await fetchAPI<Bill[]>(`/families/${familyId}/bills`);
                setBills(response.data);
                setError(null);
                hasError.current = false;
            } catch (err) {
                console.error('获取账单失败', err);
                showToast && showToast(handleQueryError(err as Error, '获取账单失败'), 'error');
                setError(err as Error);
                setBills([]);
                hasError.current = true;
            } finally {
                setIsLoading(false);
            }
        };

        if (familyId && (!requestAttempted.current || !hasError.current)) {
            fetchBills();
        } else if (!familyId) {
            setBills([]);
            setIsLoading(false);
        }
    }, [familyId, showToast]);

    return { bills, isLoading, error };
} 