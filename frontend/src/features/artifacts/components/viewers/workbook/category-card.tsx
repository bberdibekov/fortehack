import { Plus, Target, Users, Activity, GitMerge } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';

// Types
import { type WorkbookCategory } from '@/core/api/types/generated';
import { type UIWorkbookItem } from '@/features/artifacts/types/ui-types';

// Components - Ensure this import path is correct relative to this file
import { EditableItem } from './editable-item';
import { GlossaryLabel } from '@/shared/components/glossary-label';

interface CategoryCardProps {
  category: WorkbookCategory;
  onUpdate: (updatedCategory: WorkbookCategory) => void;
}

const getGlossaryKey = (title: string): string => {
  const t = title.toLowerCase();
  if (t.includes('goal')) return 'goal';
  if (t.includes('scope')) return 'scope';
  if (t.includes('actor')) return 'actors';
  if (t.includes('kpi')) return 'kpis';
  if (t.includes('process')) return 'happy path'; // Map process to happy path help
  return '';
};

export const CategoryCard = ({ category, onUpdate }: CategoryCardProps) => {
  
  const getIcon = (name?: string | null) => {
    // Check if name exists before switching
    if (!name) return <Activity className="h-4 w-4" />;

    switch(name) {
      case 'target': return <Target className="h-4 w-4 text-blue-500" />;
      case 'users': return <Users className="h-4 w-4 text-purple-500" />;
      case 'activity': return <Activity className="h-4 w-4 text-emerald-500" />;
      case 'process': return <GitMerge className="h-4 w-4 text-amber-500" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const isProcessCategory = category.icon === 'process' || category.title.toLowerCase().includes('process');

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
    <Card className="shadow-sm border-muted-foreground/20 bg-card/50 backdrop-blur-sm transition-all hover:border-muted-foreground/40">
      <CardHeader className="pb-2 border-b bg-muted/20">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
          {getIcon(category.icon)}
          <GlossaryLabel term={getGlossaryKey(category.title)}>
            {category.title}
          </GlossaryLabel>
          <span className="ml-auto text-xs font-normal opacity-50">
            {category.items.length} items
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-2">
        <div className="flex flex-col">
          {category.items.map(item => {
            const uiItem = item as UIWorkbookItem;
            return (
                <EditableItem 
                  key={uiItem.id}
                  value={uiItem.text}
                  isNew={uiItem.isNew}
                  // Explicitly type 'val' here to fix the TS error
                  onSave={(val: string) => handleUpdateItem(uiItem.id, val)}
                  onDelete={() => handleDeleteItem(uiItem.id)}
                  isProcess={isProcessCategory}
                />
            );
          })}

          <Button 
            variant="ghost" 
            size="sm" 
            className="justify-start text-muted-foreground hover:text-primary mt-2 -ml-2 h-8 text-xs"
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