import { useEffect, useState } from 'react';
import { 
    type WorkbookData, 
    type WorkbookCategory,
    type DataEntity,
    type NonFunctionalRequirement 
} from '@/core/api/types/generated';
import { useArtifactStore } from '@/features/artifacts/stores/artifact-store';
import { useChatSocket } from '@/shared/hooks/use-chat-socket';
import { useDebouncedCallback } from '@/shared/hooks/use-debounce';

// Sub-components
import { CategoryCard } from './workbook/category-card';
import { DataEntitySection } from './workbook/data-entity-card';
import { NfrSection } from './workbook/nfr-section';             

import * as styles from './styles/analyst-workbook.styles';

// Extend the interface to include new fields locally
// (Ideally this should match the Generated WorkbookData, but if there is drift we extend here)
interface ExtendedWorkbookData extends WorkbookData {
  dataEntities?: DataEntity[];
  nfrs?: NonFunctionalRequirement[];
}

interface AnalystWorkbookProps {
  artifactId: string;
  content: string;
}

export const AnalystWorkbook = ({ artifactId, content }: AnalystWorkbookProps) => {
  const { updateArtifactContent, setArtifactSyncStatus } = useArtifactStore();
  const { saveArtifact } = useChatSocket();

  const [data, setData] = useState<ExtendedWorkbookData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const debouncedSave = useDebouncedCallback((id: string, jsonString: string) => {
    setArtifactSyncStatus(id, 'saving');
    saveArtifact(id, jsonString);
  }, 1000);

  useEffect(() => {
    try {
      const parsed = JSON.parse(content);
      // Support flexible structure (backend might send camelCase or snake_case)
      const normalized: ExtendedWorkbookData = {
          categories: parsed.categories || [],
          dataEntities: parsed.dataEntities || parsed.data_entities || [],
          nfrs: parsed.nfrs || []
      };
      
      setData(normalized);
      setError(null);
    } catch (err) {
      console.error("Workbook Parse Error:", err);
      setError("Invalid JSON format for Workbook.");
    }
  }, [content]);

  // Handle Updates for existing Categories
  const handleCategoryUpdate = (updatedCategory: WorkbookCategory) => {
    if (!data) return;
    const newData = {
      ...data,
      categories: data.categories.map(cat =>
        cat.id === updatedCategory.id ? updatedCategory : cat
      )
    };
    // Update local and store
    setData(newData);
    const jsonString = JSON.stringify(newData, null, 2);
    updateArtifactContent(artifactId, jsonString);
    debouncedSave(artifactId, jsonString);
  };

  if (error) {
    return (
      <div className={styles.ERROR_CONTAINER_CLASSES}>
        {/* ... error UI ... */}
        <p>{error}</p>
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className={styles.WORKBOOK_WRAPPER_CLASSES}>
      <div className={styles.CONTENT_LAYOUT_CLASSES}>
        
        {/* 1. Header */}
        <div className={styles.HEADER_WRAPPER_CLASSES}>
          <h1 className={styles.HEADER_TITLE_CLASSES}>Analyst Workbook</h1>
          <p className={styles.HEADER_DESCRIPTION_CLASSES}>
            Comprehensive analysis including Scope, Data Dictionary, and NFRs.
          </p>
        </div>

        {/* 2. Original Categories (Goals, Scope, Actors) */}
        <div className={styles.CATEGORY_GRID_CLASSES}>
          {data.categories.map(category => (
            <CategoryCard
              key={category.id}
              category={category}
              onUpdate={handleCategoryUpdate}
            />
          ))}
        </div>

        {/* 3. NEW: Data Entities */}
        {data.dataEntities && data.dataEntities.length > 0 && (
            <DataEntitySection entities={data.dataEntities} />
        )}

        {/* 4. NEW: NFRs */}
        {data.nfrs && data.nfrs.length > 0 && (
            <NfrSection nfrs={data.nfrs} />
        )}

        <div className="h-10" /> {/* Bottom Spacer */}
      </div>
    </div>
  );
};