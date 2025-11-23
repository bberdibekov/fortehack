import React from 'react';
import { Plus, Target, Users, Activity, GitMerge } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { WorkbookCategory } from '@/features/artifacts/types/workbook-types';
import { EditableItem } from './editable-item';

interface CategoryCardProps {
  category: WorkbookCategory;
  onUpdate: (updatedCategory: WorkbookCategory) => void;
}

export const CategoryCard = ({ category, onUpdate }: CategoryCardProps) => {
  
  // Helper to map string icon names to Components
  const getIcon = (name?: string) => {
    switch(name) {
      case 'target': return <Target className="h-4 w-4 text-blue-500" />;
      case 'users': return <Users className="h-4 w-4 text-purple-500" />;
      case 'activity': return <Activity className="h-4 w-4 text-emerald-500" />;
      case 'process': return <GitMerge className="h-4 w-4 text-amber-500" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const handleAddItem = () => {
    const newItem = {
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
      items: category.items.map(item => 
        item.id === itemId ? { ...item, text: newText, isNew: false } : item
      )
    });
  };

  const handleDeleteItem = (itemId: string) => {
    onUpdate({
      ...category,
      items: category.items.filter(item => item.id !== itemId)
    });
  };

  return (
    <Card className="shadow-sm border-muted-foreground/20 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2 border-b bg-muted/20">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
          {getIcon(category.icon)}
          {category.title}
          <span className="ml-auto text-xs font-normal opacity-50">
            {category.items.length} items
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="flex flex-col">
          {category.items.map(item => (
            <EditableItem 
              key={item.id}
              value={item.text}
              isNew={item.isNew}
              onSave={(val) => handleUpdateItem(item.id, val)}
              onDelete={() => handleDeleteItem(item.id)}
            />
          ))}

          <Button 
            variant="ghost" 
            size="sm" 
            className="justify-start text-muted-foreground hover:text-primary mt-2 -ml-2"
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