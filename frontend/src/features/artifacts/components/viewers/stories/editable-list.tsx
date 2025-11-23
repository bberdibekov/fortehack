import { Plus } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { EditableItem } from '../workbook/editable-item';

interface EditableListProps {
  items: string[];
  onUpdate: (newItems: string[]) => void;
  placeholder?: string;
}

export const EditableList = ({ items, onUpdate }: EditableListProps) => {
  
  const handleItemChange = (index: number, newValue: string) => {
    const newItems = [...items];
    newItems[index] = newValue;
    onUpdate(newItems);
  };

  const handleDelete = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onUpdate(newItems);
  };

  const handleAdd = () => {
    onUpdate([...items, ""]); // Add empty string, EditableItem will handle focus
  };

  return (
    <div className="space-y-1">
      {items.map((item, i) => (
        <div key={i} className="relative">
             {/* We map generic string[] to the format EditableItem expects */}
             <EditableItem 
                value={item}
                isNew={item === ""}
                onSave={(val) => handleItemChange(i, val)}
                onDelete={() => handleDelete(i)}
             />
        </div>
      ))}
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleAdd}
        className="h-8 text-xs text-muted-foreground hover:text-primary -ml-2"
      >
        <Plus className="h-3 w-3 mr-1.5" />
        Add Item
      </Button>
    </div>
  );
};