'use client';

import { useState, useMemo } from 'react';
import type { Project, ProjectStatus, ProjectCategory } from '@/services/project-service';

/**
 * Task Fix: Cleaned legacy useMockStore dependency. 
 * This hook is now a state management shell for the Projects Hub.
 */

export function useProjectHub() {
    const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
    const [categoryFilter, setCategoryFilter] = useState<ProjectCategory | 'all'>('all');

    return {
        statusFilter,
        setStatusFilter,
        categoryFilter,
        setCategoryFilter,
    };
}
