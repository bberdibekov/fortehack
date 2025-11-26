import React from 'react';
import { BookOpen, Lightbulb } from 'lucide-react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/shared/components/ui/hover-card";
import { cn } from '@/shared/utils';

// --- DATA: THE ANALYST DICTIONARY ---
const DEFINITIONS: Record<string, { definition: string; example: string }> = {
  "goal": {
    definition: "The high-level business outcome. What are we trying to achieve?",
    example: "Increase market share by 15% in the APAC region."
  },
  "scope": {
    definition: "The boundaries of the project. What is included and explicitly excluded.",
    example: "In Scope: iOS App. Out of Scope: Android App."
  },
  "actors": {
    definition: "The people or systems interacting with the solution.",
    example: "Primary User: Financial Analyst. Secondary: System Admin."
  },
  "kpis": {
    definition: "Key Performance Indicators. Quantifiable metrics to judge success.",
    example: "Reduce processing time from 3 days to 4 hours."
  },
  "happy path": {
    definition: "The default scenario where everything goes right.",
    example: "User logs in -> Adds item -> Pays -> Receives email."
  },
  "edge case": {
    definition: "Rare situations or errors that must be handled.",
    example: "User tries to pay with an expired credit card."
  },
  "user story": {
    definition: "A feature definition from the user's perspective.",
    example: "As a [role], I want to [action], so that [benefit]."
  },
  "acceptance criteria": {
    definition: "A checklist of requirements that must be met to mark the story complete.",
    example: "System must validate email format. Password must be 8 chars."
  },
  "estimate": {
    definition: "A rough measure of effort/complexity (Story Points).",
    example: "1 (Tiny), 3 (Small), 5 (Medium), 8 (Large)."
  }
};

interface GlossaryLabelProps {
  term: string; // The key to look up
  children?: React.ReactNode; // Optional override text
  className?: string;
}

export const GlossaryLabel = ({ term, children, className }: GlossaryLabelProps) => {
  const key = term.toLowerCase();
  const data = DEFINITIONS[key];

  // If we don't have a definition, just render the text normally
  if (!data) return <span className={className}>{children || term}</span>;

  return (
    <HoverCard openDelay={200}>
      <HoverCardTrigger asChild>
        <span className={cn(
          "cursor-help decoration-dotted underline decoration-muted-foreground/50 hover:decoration-primary hover:text-foreground transition-all",
          className
        )}>
          {children || term}
        </span>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="flex justify-between space-x-4">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2 capitalize">
              <BookOpen className="h-4 w-4 text-blue-500" />
              {term}
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {data.definition}
            </p>
            <div className="flex items-start gap-2 p-2 bg-muted/50 rounded-md border text-xs">
              <Lightbulb className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
              <span className="italic text-muted-foreground">
                "{data.example}"
              </span>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};