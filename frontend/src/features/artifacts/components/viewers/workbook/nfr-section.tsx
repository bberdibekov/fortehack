import { ShieldCheck, Zap, Lock, Eye, Server } from 'lucide-react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { type NonFunctionalRequirement } from '@/core/api/types/generated';

interface NfrSectionProps {
  nfrs: NonFunctionalRequirement[];
}

const getCategoryConfig = (cat: string) => {
    const c = cat.toLowerCase();
    if (c.includes('security')) return { icon: Lock, color: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-200' };
    if (c.includes('performance')) return { icon: Zap, color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200' };
    if (c.includes('reliability')) return { icon: Server, color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200' };
    return { icon: ShieldCheck, color: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300' };
};

export const NfrSection = ({ nfrs }: NfrSectionProps) => {
  if (!nfrs || nfrs.length === 0) return null;

  return (
    <div className="space-y-4 mt-8">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" /> Non-Functional Requirements
        </h3>

        <Card className="shadow-sm border-slate-200 dark:border-slate-800">
            <CardContent className="p-0 divide-y divide-slate-100 dark:divide-slate-800">
                {nfrs.map((item, idx) => {
                    const config = getCategoryConfig(item.category);
                    const Icon = config.icon;
                    
                    return (
                        <div key={item.id || idx} className="flex items-start gap-4 p-4 hover:bg-muted/5 transition-colors">
                            <div className={`shrink-0 p-2 rounded-lg ${config.color} border`}>
                                <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-sm">{item.category}</span>
                                    {/* Optional ID display if needed */}
                                    {/* <span className="text-[10px] font-mono text-muted-foreground">{item.id}</span> */}
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {item.requirement}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    </div>
  );
};