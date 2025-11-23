export interface UserStory {
  id: string; // e.g., "US-101"
  priority: 'High' | 'Medium' | 'Low';
  estimate: string; // e.g., "5 SP" or "M"
  
  // The "User Story" Sentence components
  role: string;
  action: string;
  benefit: string;
  
  // Context
  description: string;
  goal: string;
  
  // Boundaries
  scope: string[];
  outOfScope: string[];
  
  // Validation
  acceptanceCriteria: string[];
}

export interface UserStoryData {
  stories: UserStory[];
}