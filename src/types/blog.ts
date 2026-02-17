export type BlogCategory = "news" | "guide" | "review" | "other";
export type BlogLang = "ru" | "en" | "ko";

export interface BlogPost {
  id: string;
  slug: string;
  category: BlogCategory;
  source?: string;
  published_at: string;
  cover_url?: string;
  tags?: string[];
  title: string;
  excerpt?: string;
  content?: string;
}

export interface BlogListResponse {
  posts: BlogPost[];
  total: number;
  page: number;
  totalPages: number;
}
