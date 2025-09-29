'use client';

import { useMutation } from '@tanstack/react-query';
import { updatePrivacySettings } from '@/lib/api';

export function usePrivacySettingsMutation() {
    return useMutation({
        mutationFn: updatePrivacySettings,
    });
}
