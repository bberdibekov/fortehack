import { 
  User, PlayCircle, CheckCircle2, CornerDownRight, ListStart 
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Separator } from '@/shared/components/ui/separator';

// Reuse the EditableText from user stories (assuming it's exported)
import { EditableText } from '../stories/editable-text'; 

import * as styles from '../styles/use-case-viewer.styles';
import { type UseCase } from '@/core/api/types/generated';

interface UseCaseCardProps {
  useCase: UseCase;
  onUpdate: (updated: UseCase) => void;
}

export const UseCaseCard = ({ useCase, onUpdate }: UseCaseCardProps) => {

  // --- HANDLERS ---
  const handleStepUpdate = (index: number, newAction: string) => {
    const newFlow = [...useCase.mainFlow];
    newFlow[index] = { ...newFlow[index], action: newAction };
    onUpdate({ ...useCase, mainFlow: newFlow });
  };

  const handleAltFlowUpdate = (index: number, newAlt: string) => {
    const newFlow = [...useCase.mainFlow];
    newFlow[index] = { ...newFlow[index], alternativeFlow: newAlt };
    onUpdate({ ...useCase, mainFlow: newFlow });
  };

  return (
    <Card className={styles.CARD_CLASSES}>
      <CardHeader className={styles.CARD_HEADER_CLASSES}>
        <div className={styles.CARD_TITLE_WRAPPER_CLASSES}>
          <CardTitle className={styles.TITLE_TEXT_CLASSES}>
            <span className={styles.ID_BADGE_CLASSES}>{useCase.id}</span>
            <EditableText 
               value={useCase.title} 
               onSave={(val) => onUpdate({...useCase, title: val})} 
            />
          </CardTitle>
          <Badge variant="outline" className={styles.ACTOR_BADGE_CLASSES}>
            <User className={styles.ACTOR_ICON_CLASSES} />
            Actor: 
            <div className="ml-1 min-w-[20px] inline-block">
                <EditableText 
                    value={useCase.primaryActor} 
                    onSave={(val) => onUpdate({...useCase, primaryActor: val})} 
                />
            </div>
          </Badge>
        </div>

        <Separator className="my-2 bg-slate-200/60 dark:bg-slate-800" />

        {/* Pre/Post Conditions */}
        <div className={styles.CONDITIONS_GRID_CLASSES}>
          <div>
            <h4 className={styles.CONDITION_HEADER_CLASSES}>
              <PlayCircle className="h-3.5 w-3.5" /> Pre-Conditions
            </h4>
            <div className={styles.CONDITION_LIST_CLASSES}>
               {/* Simplified edit: just editing existing lines for now */}
              {useCase.preconditions.map((pre, i) => (
                <div key={i} className="flex gap-2 items-start">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-300 shrink-0" />
                    <EditableText 
                        value={pre} 
                        multiline
                        onSave={(val) => {
                            const newPre = [...useCase.preconditions];
                            newPre[i] = val;
                            onUpdate({...useCase, preconditions: newPre});
                        }} 
                    />
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className={styles.CONDITION_HEADER_CLASSES}>
              <CheckCircle2 className="h-3.5 w-3.5" /> Post-Conditions
            </h4>
             <div className={styles.CONDITION_LIST_CLASSES}>
              {useCase.postconditions.map((post, i) => (
                 <div key={i} className="flex gap-2 items-start">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-300 shrink-0" />
                    <EditableText 
                        value={post} 
                        multiline
                        onSave={(val) => {
                            const newPost = [...useCase.postconditions];
                            newPost[i] = val;
                            onUpdate({...useCase, postconditions: newPost});
                        }} 
                    />
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>

      {/* 2. Main Flow */}
      <CardContent className={styles.FLOW_CONTENT_CLASSES}>
        <h3 className={styles.FLOW_HEADER_CLASSES}>
          <ListStart className="h-4 w-4" /> Main Success Scenario
        </h3>
        
        <div className={styles.FLOW_CONTAINER_CLASSES}>
          <div className={styles.FLOW_VERTICAL_LINE_CLASSES} />
          
          <div>
            {useCase.mainFlow.map((step, index) => (
              <div key={step.stepNumber} className={styles.STEP_WRAPPER_CLASSES}>
                {/* Number Bubble */}
                <div className="flex-none z-10 pt-0.5">
                  <div className={styles.STEP_NUMBER_CIRCLE_CLASSES}>
                    {step.stepNumber}
                  </div>
                </div>
                
                {/* Content */}
                <div className="flex-1">
                  {/* --- 1: EDITABLE STEP --- */}
                  <div className={styles.STEP_TEXT_CLASSES}>
                      <EditableText 
                        value={step.action} 
                        multiline
                        onSave={(val) => handleStepUpdate(index, val)}
                        className="font-medium text-slate-800 dark:text-slate-100"
                      />
                  </div>

                  {/* Alternative Flow */}
                  {step.alternativeFlow && (
                    <div className={styles.ALT_FLOW_WRAPPER_CLASSES}>
                      <CornerDownRight className={styles.ALT_FLOW_ICON_CLASSES} />
                      <div className={styles.ALT_FLOW_BOX_CLASSES}>
                        <span className={styles.ALT_FLOW_LABEL_CLASSES}>Alternative Flow</span>
                        <EditableText 
                            value={step.alternativeFlow} 
                            multiline
                            onSave={(val) => handleAltFlowUpdate(index, val)}
                            className="text-amber-900 dark:text-amber-100/90"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};