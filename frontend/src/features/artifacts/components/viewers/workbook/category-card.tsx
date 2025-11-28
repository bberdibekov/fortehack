import { Plus, Target, Users, Activity, GitMerge } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { type WorkbookCategory } from '@/core/api/types/generated';
import { type UIWorkbookItem } from '@/features/artifacts/types/ui-types';
import { EditableItem, type ItemVariant } from './editable-item';
import { GlossaryLabel } from '@/shared/components/glossary-label';
import * as styles from '../styles/category-card.styles';

interface CategoryCardProps {
  category: WorkbookCategory;
  onUpdate: (updatedCategory: WorkbookCategory) => void;
}

// --- UPDATED LOGIC ---
const getVariant = (category: WorkbookCategory): ItemVariant => {
  const icon = category.icon;
  const title = category.title.toLowerCase();

  // 1. Priority: Explicit Icon from Backend
  if (icon === 'users') return 'actor';
  if (icon === 'activity') return 'metric';
  if (icon === 'target') return 'goal';
  if (icon === 'process') return 'process';

  // 2. Fallback: Detect based on Title keywords
  if (title.includes('actor') || title.includes('stakeholder') || title.includes('persona')) return 'actor';
  if (title.includes('kpi') || title.includes('metric') || title.includes('indicator')) return 'metric';
  if (title.includes('goal') || title.includes('objective') || title.includes('scope')) return 'goal';
  if (title.includes('process') || title.includes('flow')) return 'process';

  return 'default';
};

const getIcon = (name?: string | null) => {
    if (!name) return <Activity className="h-4 w-4" />;
    switch(name) {
      case 'target': return <Target className="h-4 w-4 text-blue-500" />;
      case 'users': return <Users className="h-4 w-4 text-purple-500" />;
      case 'activity': return <Activity className="h-4 w-4 text-emerald-500" />;
      case 'process': return <GitMerge className="h-4 w-4 text-amber-500" />;
      default: return <Activity className="h-4 w-4" />;
    }
};

export const CategoryCard = ({ category, onUpdate }: CategoryCardProps) => {
  
  // Pass the whole category to the new helper
  const variant = getVariant(category);

  const handleAddItem = () => {
    const newItem: UIWorkbookItem = {
      id: Math.random().toString(36).substr(2, 9),
      text: "",
      isNew: true
    };
    onUpdate({
      ...category,
      items: [...category.items, newItem]
    });
  };

  const handleUpdateItem = (itemId: string, newText: string) => {
    onUpdate({
      ...category,
      items: category.items.map(item => {
        if (item.id === itemId) {
            const { isNew, ...rest } = item as UIWorkbookItem;
            return { ...rest, text: newText };
        }
        return item;
      })
    });
  };

  const handleDeleteItem = (itemId: string) => {
    onUpdate({
      ...category,
      items: category.items.filter(item => item.id !== itemId)
    });
  };

  return (
    <Card className={styles.CARD_CLASSES}>
      <CardHeader className={styles.CARD_HEADER_CLASSES}>
        <CardTitle className={styles.CARD_TITLE_CLASSES}>
          {getIcon(category.icon)}
          <GlossaryLabel term={category.title}>
            {category.title}
          </GlossaryLabel>
          <span className={styles.TITLE_COUNT_CLASSES}>
            {category.items.length} items
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className={styles.CARD_CONTENT_CLASSES}>
        <div className="flex flex-col">
          {category.items.map(item => {
            const uiItem = item as UIWorkbookItem;
            return (
                <EditableItem 
                  key={uiItem.id}
                  value={uiItem.text}
                  isNew={uiItem.isNew}
                  onSave={(val: string) => handleUpdateItem(uiItem.id, val)}
                  onDelete={() => handleDeleteItem(uiItem.id)}
                  variant={variant} // Passes the detected variant
                />
            );
          })}

          <Button 
            variant="ghost" 
            size="sm" 
            className={styles.ADD_ITEM_BUTTON_CLASSES}
            onClick={handleAddItem}
          >
            <Plus className="h-3.5 w-3.5 mr-2" />
            Add Item
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};