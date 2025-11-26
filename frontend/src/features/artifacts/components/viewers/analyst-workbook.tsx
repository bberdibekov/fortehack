import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { type WorkbookData, type WorkbookCategory } from '@/core/api/types/generated';
import { useArtifactStore } from '@/features/artifacts/stores/artifact-store';
import { CategoryCard } from './workbook/category-card';

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
      // Basic validation to ensure it has categories
      if (!parsed || !Array.isArray(parsed.categories)) {
          throw new Error("Missing 'categories' array");
      }
      setData(parsed);
      setError(null);
    } catch (err) {
      console.error("Workbook Parse Error:", err);
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

    // Sync to Store (Serialize back to string for persistence/export)
    updateArtifactContent(artifactId, JSON.stringify(newData, null, 2));
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-destructive p-8 text-center bg-destructive/5">
        <div className="p-3 bg-destructive/10 rounded-full mb-3">
             <AlertTriangle className="h-8 w-8" />
        </div>
        <h3 className="font-semibold text-lg mb-1">Failed to load Workbook</h3>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <div className="w-full max-w-md bg-muted/50 p-4 rounded-md border text-left overflow-auto max-h-[200px]">
            <code className="text-xs font-mono whitespace-pre-wrap">{content}</code>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="h-full w-full bg-slate-50 dark:bg-slate-950/50 overflow-y-auto p-4 md:p-8 scrollbar-hide">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Analyst Workbook</h1>
          <p className="text-muted-foreground mt-1">Interactive analysis of requirements, actors, and scope.</p>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
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