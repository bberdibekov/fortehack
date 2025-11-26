// src/features/artifacts/components/viewers/analyst-workbook.tsx
import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { type WorkbookData, type WorkbookCategory } from '@/core/api/types/generated';
import { useArtifactStore } from '@/features/artifacts/stores/artifact-store';
import { CategoryCard } from './workbook/category-card';
import { useChatSocket } from '@/shared/hooks/use-chat-socket'; 
import * as styles from './styles/analyst-workbook.styles';

interface AnalystWorkbookProps {
  artifactId: string;
  content: string;
}

export const AnalystWorkbook = ({ artifactId, content }: AnalystWorkbookProps) => {
  const { updateArtifactContent } = useArtifactStore();
  const { saveArtifact } = useChatSocket(); 
  
  const [data, setData] = useState<WorkbookData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 1. Parse JSON on mount or content change
  useEffect(() => {
    try {
      const parsed = JSON.parse(content);
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

    const jsonString = JSON.stringify(newData, null, 2);

    // Sync to Local Store
    updateArtifactContent(artifactId, jsonString);

    // Sync to Backend
    // Frontend type 'workbook' maps to backend 'analyst_workbook' via your key_map
    saveArtifact("workbook", jsonString);
  };

  if (error) {
    return (
      <div className={styles.ERROR_CONTAINER_CLASSES}>
        <div className={styles.ERROR_ICON_WRAPPER_CLASSES}>
             <AlertTriangle className="h-8 w-8" />
        </div>
        <h3 className={styles.ERROR_TITLE_CLASSES}>Failed to load Workbook</h3>
        <p className={styles.ERROR_PARAGRAPH_CLASSES}>{error}</p>
        <div className={styles.ERROR_CODE_BLOCK_CLASSES}>
            <code className={styles.ERROR_CODE_ELEMENT_CLASSES}>{content}</code>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className={styles.WORKBOOK_WRAPPER_CLASSES}>
      <div className={styles.CONTENT_LAYOUT_CLASSES}>
        
        {/* Header Section */}
        <div className={styles.HEADER_WRAPPER_CLASSES}>
          <h1 className={styles.HEADER_TITLE_CLASSES}>Analyst Workbook</h1>
          <p className={styles.HEADER_DESCRIPTION_CLASSES}>Interactive analysis of requirements, actors, and scope.</p>
        </div>

        {/* Grid Layout */}
        <div className={styles.CATEGORY_GRID_CLASSES}>
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