export interface BlogContent {
  id?: string;
  type: 'paragraph' | 'headline' | 'image' | 'video' | 'quote' | 'link' | 'codeblock' | 'divider';
  content: string | any;
  alt?: string;
}

export interface BlogBody {
  title: string;
  shortDesc: string;
  poster?: string;
  tags: string[];
  authorId: string;
  content: {
    create: BlogContent[];
  };
}
