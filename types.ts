export interface VocabularyItem {
  id: string;
  word: string;
  meaning: string;
  imageUrl: string;
  // SRS Properties
  nextReviewDate: string; // ISO string for the next review date
  repetition: number; // Number of times recalled correctly in a row
  interval: number; // Current interval in days until next review
  // Feynman Technique
  explanation?: string;
}