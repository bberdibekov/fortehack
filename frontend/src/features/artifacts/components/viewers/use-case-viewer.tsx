import { useState, useEffect } from 'react';
import { UseCaseCard } from './use-cases/use-case-card';
import * as styles from './styles/use-case-viewer.styles';
import { type UseCase } from '@/core/api/types/generated';

import { useArtifactStore } from '@/features/artifacts/stores/artifact-store';
import { useChatSocket } from '@/shared/hooks/use-chat-socket';
import { useDebouncedCallback } from '@/shared/hooks/use-debounce';

interface UseCaseViewerProps {
  content: string;
}

export const UseCaseViewer = ({ content }: UseCaseViewerProps) => {
  const { activeArtifactId, updateArtifactContent, setArtifactSyncStatus } = useArtifactStore();
  const { saveArtifact } = useChatSocket();

  const [useCases, setUseCases] = useState<UseCase[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 1. Debounced Save
  const debouncedSave = useDebouncedCallback((id: string, jsonString: string) => {
      setArtifactSyncStatus(id, 'saving');
      saveArtifact(id, jsonString);
  }, 1000);

  // 2. Load & Normalize (Snake -> Camel)
  useEffect(() => {
    try {
      const parsed = JSON.parse(content);
      const rawList = parsed.use_cases || parsed.useCases;
      
      if (!rawList || !Array.isArray(rawList)) {
         if (content.trim().length > 0) throw new Error("Missing 'use_cases'");
         return;
      }

      const normalized: UseCase[] = rawList.map((uc: any) => ({
        id: uc.id,
        title: uc.title,
        primaryActor: uc.primary_actor || uc.primaryActor, 
        preconditions: uc.preconditions || [],
        postconditions: uc.postconditions || [],
        mainFlow: (uc.main_flow || uc.mainFlow || []).map((step: any) => ({
             stepNumber: step.step_number || step.stepNumber,   
             action: step.action,
             alternativeFlow: step.alternative_flow || step.alternativeFlow 
        }))
      }));

      setUseCases(normalized);
      setError(null);
    } catch (err) {
      if (content.trim().length > 0) setError("Invalid JSON format");
    }
  }, [content]);

  // 3. Update & Serialize (Camel -> Snake)
  const handleUpdate = (updatedUseCase: UseCase) => {
    const newUseCases = useCases.map(uc => 
        uc.id === updatedUseCase.id ? updatedUseCase : uc
    );
    
    // Optimistic UI
    setUseCases(newUseCases);

    if (activeArtifactId) {
        // --- SERIALIZATION LOGIC ---
        // Convert back to backend schema
        const backendPayload = {
            use_cases: newUseCases.map(uc => ({
                id: uc.id,
                title: uc.title,
                primary_actor: uc.primaryActor,
                preconditions: uc.preconditions,
                postconditions: uc.postconditions,
                main_flow: uc.mainFlow.map(step => ({
                    step_number: step.stepNumber,
                    action: step.action,
                    alternative_flow: step.alternativeFlow
                }))
            }))
        };

        const jsonString = JSON.stringify(backendPayload, null, 2);
        
        updateArtifactContent(activeArtifactId, jsonString);
        debouncedSave(activeArtifactId, jsonString);
    }
  };

  if (error) return <div className="p-8 text-destructive">{error}</div>;

  return (
    <div className={styles.CONTAINER_CLASSES}>
      <div className={styles.WRAPPER_CLASSES}>
        {useCases.map((uc) => (
          <UseCaseCard 
            key={uc.id} 
            useCase={uc} 
            onUpdate={handleUpdate} 
          />
        ))}
        <div className="h-10" />
      </div>
    </div>
  );
};