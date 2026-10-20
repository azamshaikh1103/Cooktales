'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, LoaderCircle, Send } from 'lucide-react';
import { toast } from 'sonner';
import { HeaderImageUpload, TagEditor } from '../newRecipe/RecipeComponents';
import { StoryBlockList, type StoryEditorBlock } from './StoryComponents';
import Navbar from '@/components/Navbar';
import { useCloudinaryUpload, type CloudinaryUploadResult } from '@/lib/hooks/useCloudinaryUpload';
import { storyClient, type Story, type StoryBlockInput, type StoryMediaInput, type UpdateStoryInput } from '@/lib/api/storyClient';
import { useAuth } from '@/lib/auth/AuthContext';

const initialBlock = (): StoryEditorBlock => ({ id: crypto.randomUUID(), type: 'paragraph', value: '' });

export default function NewStory() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useAuth();
  const { uploadFile, uploading } = useCloudinaryUpload();
  const [draft, setDraft] = useState<Story | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cover, setCover] = useState<CloudinaryUploadResult | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [content, setContent] = useState<StoryEditorBlock[]>([initialBlock()]);
  const [syncState, setSyncState] = useState<'starting' | 'saved' | 'saving' | 'error'>('starting');
  const [isPublishing, setIsPublishing] = useState(false);
  const clientDraftId = useRef(typeof crypto !== 'undefined' ? crypto.randomUUID() : `story-${Date.now()}`).current;
  const skipFirstSave = useRef(true);
  const existingDraftId = searchParams.get('draft');

  useEffect(() => {
    if (status !== 'authenticated') return;
    let active = true;
    if (existingDraftId) {
      void storyClient.getOwner(existingDraftId).then(({ story }) => {
        if (!active) return;
        const mediaByPublicId = new Map((story.media || []).map((media) => [media.publicId, media]));
        setDraft(story);
        setTitle(story.title === 'Untitled Story' ? '' : story.title);
        setDescription(story.shortDesc || '');
        setTags(story.tags || []);
        setCover(story.coverImage && story.coverImagePublicId ? {
          publicId: story.coverImagePublicId,
          publicUrl: story.coverImage,
          resourceType: 'image',
        } : null);
        const restoredContent = (story.content || []).map((block) => {
          const value = block.content;
          const publicId = typeof value.publicId === 'string' ? value.publicId : undefined;
          const media = publicId ? mediaByPublicId.get(publicId) : undefined;
          return {
            id: block.id,
            type: block.type,
            value: typeof value.text === 'string' ? value.text : typeof value.url === 'string' ? value.url : media?.url || '',
            ...(media ? {
              media: {
                publicId: media.publicId,
                publicUrl: media.url,
                resourceType: media.resourceType.toLowerCase() as CloudinaryUploadResult['resourceType'],
                width: media.width,
                height: media.height,
                bytes: media.bytes,
                format: media.format,
              },
            } : {}),
          } as StoryEditorBlock;
        });
        setContent(restoredContent.length ? restoredContent : [initialBlock()]);
        setSyncState('saved');
      }).catch((error) => {
        if (!active) return;
        setSyncState('error');
        toast.error(error instanceof Error ? error.message : 'Could not load this story draft');
      });
      return () => { active = false; };
    }
    void storyClient.createDraft(clientDraftId).then(({ story }) => {
      if (!active) return;
      setDraft(story);
      setSyncState('saved');
    }).catch((error) => {
      if (!active) return;
      setSyncState('error');
      toast.error(error instanceof Error ? error.message : 'Could not start the story draft');
    });
    return () => { active = false; };
  }, [clientDraftId, existingDraftId, status]);

  const asApiContent = (): StoryBlockInput[] => content.map((block) => ({
    type: block.type,
    content: block.media ? { url: block.value, publicId: block.media.publicId, text: block.value } : { text: block.value },
  }));
  const savedCover = draft?.coverImage && draft.coverImagePublicId
    ? { publicId: draft.coverImagePublicId, publicUrl: draft.coverImage, resourceType: 'image' as const }
    : null;
  const activeCover = cover || savedCover;
  const asApiMedia = (): StoryMediaInput[] => [
    ...(activeCover ? [{ publicId: activeCover.publicId, url: activeCover.publicUrl, resourceType: activeCover.resourceType.toUpperCase() as StoryMediaInput['resourceType'], kind: 'COVER' as const, width: cover?.width, height: cover?.height, bytes: cover?.bytes, format: cover?.format }] : []),
    ...content.flatMap((block, position) => block.media ? [{ publicId: block.media.publicId, url: block.media.publicUrl, resourceType: block.media.resourceType.toUpperCase() as StoryMediaInput['resourceType'], kind: (block.type === 'video' ? 'VIDEO' : 'IMAGE') as StoryMediaInput['kind'], position, width: block.media.width, height: block.media.height, bytes: block.media.bytes, format: block.media.format }] : []),
  ];
  const storyPayload = (version: number): UpdateStoryInput => ({
    expectedVersion: version,
    title: title.trim() || 'Untitled Story',
    shortDesc: description || null,
    ...(activeCover ? { coverImage: activeCover.publicUrl, coverImagePublicId: activeCover.publicId } : {}),
    tags,
    content: asApiContent(),
    media: asApiMedia(),
  });

  useEffect(() => {
    if (!draft) return;
    if (skipFirstSave.current) { skipFirstSave.current = false; return; }
    const timer = window.setTimeout(() => {
      setSyncState('saving');
      void storyClient.update(draft.id, storyPayload(draft.version)).then(({ story }) => { setDraft(story); setSyncState('saved'); }).catch((error) => {
        setSyncState('error');
        toast.error(error instanceof Error ? error.message : 'Could not save this draft');
      });
    }, 900);
    return () => window.clearTimeout(timer);
  // The data values intentionally trigger save. The draft version is refreshed from every successful save.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, cover, tags, content, draft?.id]);

  const handleCoverUpload = async (file: File) => {
    if (!draft) return toast.error('Preparing your draft. Try again in a moment.');
    const result = await uploadFile({ file, context: 'STORY_COVER', entityId: draft.id });
    if (!result) toast.error('Cover upload failed');
    else setCover(result);
  };
  const handleBlockUpload = async (file: File, type: 'image' | 'video') => {
    if (!draft) { toast.error('Preparing your draft. Try again in a moment.'); return null; }
    const result = await uploadFile({ file, context: 'STORY_CONTENT', entityId: draft.id, resourceType: type });
    if (!result) toast.error('Upload failed');
    return result;
  };
  const handlePublish = async () => {
    if (!draft) return;
    if (!title.trim() || !activeCover || !content.some((block) => block.type === 'divider' || block.value.trim())) {
      return toast.error('Add a title, cover image, and story content before publishing.');
    }
    setIsPublishing(true);
    try {
      const { story: latest } = await storyClient.update(draft.id, storyPayload(draft.version));
      const { story } = await storyClient.publish(latest.id);
      toast.success('Story published');
      router.push(`/stories/${story.slug}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not publish this story');
    } finally { setIsPublishing(false); }
  };

  if (status === 'loading') {
    return <main className="min-h-screen bg-white dark:bg-[#0d1f1c]" />;
  }

  if (status === 'unauthenticated') {
    return <main className="flex min-h-screen items-center justify-center bg-white px-6 dark:bg-[#0d1f1c]">
      <section className="w-full max-w-md border border-gray-200 bg-white p-8 text-center dark:border-white/10 dark:bg-[#152a26]">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Share a story with CookTale.</h1>
        <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">Sign in or create an account before starting a draft.</p>
        <button type="button" onClick={() => router.push('/auth')} className="mt-6 cursor-pointer rounded-md bg-[#006c5e] px-5 py-3 text-sm font-medium text-white dark:bg-[#4ade80] dark:text-[#092019]">Continue to sign in</button>
      </section>
    </main>;
  }

  return <main className="min-h-screen bg-white pb-24 pt-16 dark:bg-[#0d1f1c]">
    <Navbar alwaysVisible />
    <header className="border-b border-gray-100 bg-white px-6 py-4 dark:border-white/10 dark:bg-[#0d1f1c]">
      <div className="mx-auto flex max-w-4xl items-center justify-between">
        <button onClick={() => router.back()} className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-600 transition-colors hover:text-[#006c5e] dark:text-gray-300 dark:hover:text-[#4ade80]"><ArrowLeft size={17} /> Back</button>
        <span className="hidden text-sm text-gray-500 sm:block">{syncState === 'starting' ? 'Preparing draft...' : syncState === 'saving' ? 'Saving draft...' : syncState === 'saved' ? 'Draft saved' : 'Save needs attention'}</span>
        <button onClick={handlePublish} disabled={!draft || isPublishing || uploading} className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#006c5e] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#00564b] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#4ade80] dark:text-[#092019] dark:hover:bg-[#86efac]">{isPublishing ? <LoaderCircle size={16} className="animate-spin" /> : <Send size={16} />} Publish</button>
      </div>
    </header>
    <div className="mx-auto max-w-3xl px-6 py-12">
      <HeaderImageUpload currentImage={cover?.publicUrl || null} onImageSelect={(file) => void handleCoverUpload(file)} readAsDataUrl={false} />
      <p className="mt-2 text-xs text-gray-500">Cover image: JPG, PNG, or WebP. It is optimized by Cloudinary when shown to readers.</p>
      <input value={title} maxLength={140} onChange={(event) => setTitle(event.target.value)} placeholder="Story title" className="mt-10 w-full bg-transparent text-4xl font-semibold text-gray-900 outline-none placeholder:text-gray-300 dark:text-white dark:placeholder:text-gray-600" />
      <div className="mt-2 text-right text-xs text-gray-400">{title.length}/140</div>
      <textarea value={description} maxLength={600} onChange={(event) => setDescription(event.target.value)} placeholder="A short introduction" rows={2} className="mt-4 w-full resize-none bg-transparent text-xl text-gray-600 outline-none placeholder:text-gray-300 dark:text-gray-300 dark:placeholder:text-gray-600" />
      <div className="text-right text-xs text-gray-400">{description.length}/600</div>
      <div className="mt-10"><StoryBlockList content={content} onChange={setContent} onUpload={handleBlockUpload} /></div>
      <section className="mt-16 border-t border-gray-100 pt-8 dark:border-white/10"><TagEditor tags={tags} onChange={setTags} /><p className="mt-2 text-xs text-gray-500">Up to 12 tags. Each tag can have up to 30 characters.</p></section>
    </div>
  </main>;
}
