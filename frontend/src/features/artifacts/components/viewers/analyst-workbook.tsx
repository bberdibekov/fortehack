import React, { useEffect, useState } from 'react';
import { WorkbookData, WorkbookCategory } from '@/features/artifacts/types/workbook-types';
import { CategoryCard } from './workbook/category-card';
import { useArtifactStore } from '@/features/artifacts/stores/artifact-store';
import { AlertTriangle } from 'lucide-react';

interface AnalystWorkbookProps {
  artifactId: string;
  content: string;
}

export const AnalystWorkbook = ({ artifactId, content }: AnalystWorkbookProps) => {
  const { updateArtifactContent } = useArtifactStore();
  const [data, setData] = useState<WorkbookData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 1. Parse JSON on mount or content change
  useEffect(() => {
    try {
      const parsed = JSON.parse(content);
      setData(parsed);
      setError(null);
    } catch (err) {
      setError("Invalid JSON format for Workbook.");
    }
  }, [content]);

  // 2. Handle Updates
  const handleCategoryUpdate = (updatedCategory: WorkbookCategory) => {
    if (!data) return;

    const newData = {
      ...data,
      categories: data.categories.map(cat => 
        cat.id === updatedCategory.id ? updatedCategory : cat
      )
    };

    // Optimistic UI update
    setData(newData);

    // Sync to Store (Serialize back to string)
    updateArtifactContent(artifactId, JSON.stringify(newData, null, 2));
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-destructive p-8 text-center">
        <AlertTriangle className="h-8 w-8 mb-2" />
        <p>{error}</p>
        <pre className="mt-4 text-xs text-muted-foreground bg-muted p-2 rounded max-w-full overflow-auto">
            {content}
        </pre>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="h-full w-full bg-slate-50 dark:bg-slate-950/50 overflow-y-auto p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Analyst Workbook</h1>
          <p className="text-muted-foreground">Interactive analysis of requirements and scope.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {data.categories.map(category => (
            <CategoryCard 
              key={category.id}
              category={category}
              onUpdate={handleCategoryUpdate}
            />
          ))}
        </div>

      </div>
    </div>
  );
};