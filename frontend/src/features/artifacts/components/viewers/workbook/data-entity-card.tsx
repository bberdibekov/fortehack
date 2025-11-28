import { Database, Table } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { type DataEntity } from '@/core/api/types/generated';

// Reusing styles for consistency
import * as styles from '../styles/category-card.styles';

interface DataEntityCardProps {
  entities: DataEntity[];
}

export const DataEntitySection = ({ entities }: DataEntityCardProps) => {
  if (!entities || entities.length === 0) return null;

  return (
    <div className="space-y-4 mt-8">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Database className="h-4 w-4" /> Data Dictionary
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {entities.map((entity, idx) => (
                <Card key={idx} className={styles.CARD_CLASSES}>
                    <CardHeader className="pb-3 border-b bg-muted/20">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Table className="h-4 w-4 text-blue-500" />
                            {entity.name}
                        </CardTitle>
                        {entity.description && (
                            <p className="text-xs text-muted-foreground font-normal mt-1">
                                {entity.description}
                            </p>
                        )}
                    </CardHeader>
                    <CardContent className="p-3 bg-white dark:bg-slate-950/50">
                        <div className="flex flex-wrap gap-2">
                            {entity.fields?.map((field, i) => (
                                <Badge 
                                    key={i} 
                                    variant="secondary" 
                                    className="text-xs font-mono text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                                >
                                    {field}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    </div>
  );
};