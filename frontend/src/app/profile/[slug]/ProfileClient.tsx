'use client';

import {
  BookOpenText,
  Bookmark,
  BookmarkX,
  ChefHat,
  ExternalLink,
  FileText,
  Globe2,
  MapPin,
  Pencil,
  LoaderCircle,
  UserRound,
  X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { FollowButton } from '@/components/FollowBtn';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import {
  type ProfileStory,
  type ProfileBookmark,
  type ProfileRecipe,
  type ProfileListUser,
  type PublicProfile,
  profileClient,
  type ViewerProfileContext,
} from '@/lib/api/profileClient';
import { useAuth } from '@/lib/auth/AuthContext';
import imageLoader from '@/lib/loader';
import { recipeClient } from '@/lib/api/recipeClient';
import { storyClient } from '@/lib/api/storyClient';

type TabType = 'recipes' | 'stories' | 'about' | 'saved';

type ProfileClientProps = {
  user: PublicProfile;
};

export function ProfileClient({ user }: ProfileClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>('recipes');
  const [viewerContext, setViewerContext] = useState<ViewerProfileContext | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [recipes, setRecipes] = useState(user.recipes);
  const [stories, setStories] = useState(user.stories);
  const [recipePage, setRecipePage] = useState(1);
  const [storyPage, setStoryPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [savedBookmarks, setSavedBookmarks] = useState<ProfileBookmark[]>([]);
  const [savedPage, setSavedPage] = useState(1);
  const [savedTotal, setSavedTotal] = useState(0);
  const [savedType, setSavedType] = useState<'all' | 'recipes' | 'stories'>('all');
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [socialList, setSocialList] = useState<'followers' | 'following' | null>(null);
  const [followCounts, setFollowCounts] = useState({
    followers: user._count.followers,
    following: user._count.following,
  });
  const { user: authUser, status } = useAuth();
  const isSelfProfile = viewerContext?.isOwnProfile || authUser?.id === user.id || false;

  useEffect(() => {
    let cancelled = false;

    if (status !== 'authenticated') {
      setViewerContext(null);
      setIsFollowing(false);
      return;
    }

    void profileClient
      .getViewerProfileContext(user.username || user.id)
      .then((context) => {
        if (cancelled) return;
        setViewerContext(context);
        setIsFollowing(context.isFollowing);
      })
      .catch(() => {
        if (cancelled) return;
        setViewerContext(null);
        setIsFollowing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [status, user.id, user.username]);

  const tabs = useMemo(() => {
    const items: Array<{ id: TabType; label: string; count?: number }> = [
      { id: 'recipes', label: 'Recipes', count: user._count.recipes },
      { id: 'stories', label: 'Stories', count: user._count.stories },
      { id: 'about', label: 'About' },
    ];

    if (isSelfProfile) {
      items.push({
        id: 'saved',
        label: 'Saved',
        count: viewerContext?.savedCount || 0,
      });
    }

    return items;
  }, [isSelfProfile, user._count.stories, user._count.recipes, viewerContext]);

  const handleFollowChange = (following: boolean) => {
    setIsFollowing(following);
    setFollowCounts((current) => ({
      ...current,
      followers: Math.max(0, current.followers + (following ? 1 : -1)),
    }));
    toast.success(following ? 'Following chef.' : 'Unfollowed.');
  };

  const handleLoadMore = async (type: 'recipes' | 'stories') => {
    setLoadingMore(true);
    try {
      const handle = user.username || user.id;
      if (type === 'recipes') {
        const nextPage = recipePage + 1;
        const result = await profileClient.getProfileRecipes(handle, nextPage, 6);
        setRecipes((current) => [...current, ...result.items]);
        setRecipePage(nextPage);
      } else {
        const nextPage = storyPage + 1;
        const result = await profileClient.getProfileStories(handle, nextPage, 6);
        setStories((current) => [...current, ...result.items]);
        setStoryPage(nextPage);
      }
    } catch {
      toast.error('Could not load more items.');
    } finally {
      setLoadingMore(false);
    }
  };

  const loadSaved = async (
    page: number,
    type: 'all' | 'recipes' | 'stories',
    replace = false,
  ) => {
    setLoadingSaved(true);
    try {
      const result = await profileClient.getBookmarks(type, page, 12);
      setSavedBookmarks((current) => (replace ? result.items : [...current, ...result.items]));
      setSavedPage(result.page);
      setSavedTotal(result.total);
    } catch {
      toast.error('Could not load saved items.');
    } finally {
      setLoadingSaved(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'saved' || !isSelfProfile || status !== 'authenticated') return;
    void loadSaved(1, savedType, true);
  }, [activeTab, isSelfProfile, savedType, status]);

  const handleRemoveSaved = async (bookmark: ProfileBookmark) => {
    try {
      if (bookmark.recipe) {
        await recipeClient.unbookmark(bookmark.recipe.id);
      } else if (bookmark.story) {
        await storyClient.unbookmark(bookmark.story.id);
      } else {
        return;
      }
      setSavedBookmarks((current) => current.filter((item) => item.id !== bookmark.id));
      setSavedTotal((current) => Math.max(0, current - 1));
      setViewerContext((current) =>
        current ? { ...current, savedCount: Math.max(0, current.savedCount - 1) } : current,
      );
      toast.success('Removed from saved items.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not remove saved item.');
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#101827] transition-colors dark:bg-[#071714] dark:text-white">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl px-5 pt-28 pb-20 lg:px-8">
        <section className="overflow-hidden rounded-[28px] border border-gray-200 bg-white dark:border-white/10 dark:bg-[#0d1f1c]">
          <div className="relative h-44 bg-[#eef7f4] lg:h-56 dark:bg-[#10231f]">
            {user.bannerImage ? (
              <Image
                src={user.bannerImage}
                alt={`${user.name} banner`}
                fill
                priority
                loader={imageLoader}
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-[linear-gradient(135deg,#eef7f4_0%,#f8faf9_52%,#e7f3ef_100%)] dark:bg-[linear-gradient(135deg,#10231f_0%,#0d1f1c_55%,#17352e_100%)]" />
            )}
          </div>

          <div className="grid gap-8 px-6 py-7 lg:grid-cols-[1fr_340px] lg:px-9 lg:py-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-end">
              <Avatar user={user} />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-semibold tracking-normal text-[#101827] lg:text-5xl dark:text-white">
                    {user.name}
                  </h1>
                  {user.isPro && (
                    <span className="rounded-full border border-[#006C5E]/20 bg-[#f1f7f6] px-3 py-1 text-xs font-semibold text-[#006C5E] dark:border-[#4ADE80]/30 dark:bg-[#4ADE80]/10 dark:text-[#4ADE80]">
                      Verified
                    </span>
                  )}
                </div>
                <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
                  @{user.username || 'chef'}
                </p>
                <p className="mt-5 max-w-2xl text-base leading-7 text-gray-600 dark:text-gray-300">
                  {user.about || 'A CookTale creator sharing recipes, stories, and kitchen notes.'}
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-end gap-4">
              <div className="grid grid-cols-2 gap-3 rounded-2xl border border-gray-100 p-3 dark:border-white/10">
                <StatBox
                  label="Followers"
                  value={followCounts.followers}
                  onClick={() => setSocialList('followers')}
                />
                <StatBox
                  label="Following"
                  value={followCounts.following}
                  onClick={() => setSocialList('following')}
                />
                <StatBox label="Recipes" value={user._count.recipes} />
                <StatBox label="Stories" value={user._count.stories} />
              </div>
              {isSelfProfile ? (
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href="/studio"
                    className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:border-[#006C5E]/40 hover:text-[#006C5E] dark:border-white/10 dark:text-gray-200 dark:hover:border-[#4ADE80]/40 dark:hover:text-[#4ADE80]"
                  >
                    <ChefHat className="h-4 w-4" />
                    Studio
                  </Link>
                  <Link
                    href="/new-recipe"
                    className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#006C5E] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#005a4e] dark:bg-[#4ADE80] dark:text-[#0d1f1c] dark:hover:bg-[#35c96b]"
                  >
                    <Pencil className="h-4 w-4" />
                    Create
                  </Link>
                </div>
              ) : (
                <FollowButton
                  targetUserId={user.id}
                  initialIsFollowing={isFollowing}
                  onFollowChange={handleFollowChange}
                />
              )}
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
          <div>
            <nav className="flex gap-2 overflow-x-auto border-b border-gray-200 pb-3 dark:border-white/10">
              {tabs.map((tab) => (
                <TabButton
                  key={tab.id}
                  active={activeTab === tab.id}
                  label={tab.label}
                  count={tab.count}
                  onClick={() => setActiveTab(tab.id)}
                />
              ))}
            </nav>

            <div className="pt-7">
              {activeTab === 'recipes' && (
                <>
                  <RecipeGrid recipes={recipes} />
                  {recipes.length < user._count.recipes && (
                    <LoadMoreButton
                      loading={loadingMore}
                      onClick={() => void handleLoadMore('recipes')}
                    />
                  )}
                </>
              )}
              {activeTab === 'stories' && (
                <>
                  <StoryList stories={stories} />
                  {stories.length < user._count.stories && (
                    <LoadMoreButton
                      loading={loadingMore}
                      onClick={() => void handleLoadMore('stories')}
                    />
                  )}
                </>
              )}
              {activeTab === 'about' && <AboutSection user={user} />}
              {activeTab === 'saved' && isSelfProfile && (
                <SavedGrid
                  bookmarks={savedBookmarks}
                  type={savedType}
                  total={savedTotal}
                  loading={loadingSaved}
                  onTypeChange={setSavedType}
                  onRemove={handleRemoveSaved}
                  onLoadMore={() => void loadSaved(savedPage + 1, savedType)}
                />
              )}
            </div>
          </div>

          <aside className="space-y-5">
            <InfoPanel user={user} />
            <LinkPanel user={user} />
          </aside>
        </section>
      </main>
      <Footer />
      {socialList && (
        <SocialListModal
          handle={user.username || user.id}
          type={socialList}
          onClose={() => setSocialList(null)}
        />
      )}
    </div>
  );
}

function Avatar({ user }: { user: PublicProfile }) {
  return (
    <div className="-mt-24 h-36 w-36 shrink-0 overflow-hidden rounded-[26px] border-4 border-white bg-[#f1f7f6] dark:border-[#0d1f1c] dark:bg-white/10">
      {user.image ? (
        <Image
          src={user.image}
          alt={user.name}
          width={144}
          height={144}
          loader={imageLoader}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-4xl font-semibold text-[#006C5E] dark:text-[#4ADE80]">
          {user.name.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}

function StatBox({
  label,
  value,
  onClick,
}: {
  label: string;
  value: number;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className="cursor-pointer rounded-xl bg-[#fafafa] px-4 py-3 text-left transition-colors enabled:hover:bg-[#f1f7f6] disabled:cursor-default dark:bg-white/5 dark:enabled:hover:bg-white/10"
    >
      <div className="text-xl font-semibold text-[#101827] dark:text-white">{value}</div>
      <div className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">{label}</div>
    </button>
  );
}

function LoadMoreButton({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <div className="mt-6 flex justify-center">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="flex cursor-pointer items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 disabled:cursor-wait dark:border-white/10 dark:bg-[#0d1f1c] dark:text-white"
      >
        {loading && <LoaderCircle className="h-4 w-4 animate-spin" />}
        Load more
      </button>
    </div>
  );
}

function SocialListModal({
  handle,
  type,
  onClose,
}: {
  handle: string;
  type: 'followers' | 'following';
  onClose: () => void;
}) {
  const [items, setItems] = useState<ProfileListUser[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async (nextPage: number) => {
    setLoading(true);
    try {
      const result =
        type === 'followers'
          ? await profileClient.getFollowers(handle, nextPage)
          : await profileClient.getFollowing(handle, nextPage);
      setItems((current) => (nextPage === 1 ? result.items : [...current, ...result.items]));
      setPage(nextPage);
      setHasMore(result.hasMore);
    } catch {
      toast.error(`Could not load ${type}.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(1);
  }, [handle, type]);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={type}
    >
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-[#0d1f1c]">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[#101827] capitalize dark:text-white">
            {type}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-4 max-h-[55vh] space-y-2 overflow-y-auto">
          {items.map((person) => (
            <Link
              key={person.id}
              href={`/profile/${person.username || person.id}`}
              onClick={onClose}
              className="flex cursor-pointer items-center gap-3 rounded-xl p-3 hover:bg-gray-50 dark:hover:bg-white/5"
            >
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#f1f7f6] text-sm font-semibold text-[#006C5E] dark:bg-white/10 dark:text-[#4ADE80]">
                {person.image ? (
                  <Image
                    src={person.image}
                    alt={person.name}
                    width={40}
                    height={40}
                    loader={imageLoader}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  person.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#101827] dark:text-white">
                  {person.name}
                </p>
                <p className="truncate text-xs text-gray-500">@{person.username || 'chef'}</p>
              </div>
            </Link>
          ))}
          {!loading && !items.length && (
            <p className="py-10 text-center text-sm text-gray-500">No {type} yet.</p>
          )}
        </div>
        {hasMore && (
          <button
            type="button"
            onClick={() => void load(page + 1)}
            disabled={loading}
            className="mt-4 w-full cursor-pointer rounded-xl border border-gray-200 py-2.5 text-sm font-semibold disabled:cursor-wait dark:border-white/10"
          >
            {loading ? 'Loading...' : 'Load more'}
          </button>
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
        active
          ? 'bg-[#006C5E] text-white dark:bg-[#4ADE80] dark:text-[#0d1f1c]'
          : 'text-gray-500 hover:bg-gray-50 hover:text-[#006C5E] dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-[#4ADE80]'
      }`}
    >
      {label}
      {count !== undefined && <span className="text-xs opacity-70">{count}</span>}
    </button>
  );
}

function RecipeGrid({ recipes }: { recipes: ProfileRecipe[] }) {
  if (!recipes.length) return <EmptyState type="recipes" />;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {recipes.map((recipe) => (
        <RecipeTile key={recipe.id} recipe={recipe} />
      ))}
    </div>
  );
}

function RecipeTile({ recipe }: { recipe: ProfileRecipe }) {
  if (!recipe.slug) return null;

  return (
    <Link
      href={`/recipe/${recipe.slug}`}
      className="group block cursor-pointer overflow-hidden rounded-2xl border border-gray-200 bg-white transition-colors hover:border-[#006C5E]/40 dark:border-white/10 dark:bg-[#0d1f1c] dark:hover:border-[#4ADE80]/40"
    >
      <div className="relative aspect-[4/3] bg-[#f3f6f4] dark:bg-white/5">
        {recipe.mainImage ? (
          <Image
            src={recipe.mainImage}
            alt={recipe.name}
            fill
            loader={imageLoader}
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            <BookOpenText className="h-8 w-8" />
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="line-clamp-2 text-base font-semibold text-[#101827] transition-colors group-hover:text-[#006C5E] dark:text-white dark:group-hover:text-[#4ADE80]">
          {recipe.name}
        </h3>
        <div className="mt-4 flex items-center justify-between text-xs font-medium text-gray-500 dark:text-gray-400">
          <span>{recipe.totalTimeReq || 0} min</span>
          <span>{recipe.yield || 0} serves</span>
          <span>{recipe.diet || 'Any diet'}</span>
        </div>
      </div>
    </Link>
  );
}

function StoryList({ stories }: { stories: ProfileStory[] }) {
  if (!stories.length) return <EmptyState type="stories" />;

  return (
    <div className="space-y-3">
      {stories.map((story) => (
        <Link
          key={story.id}
          href={`/stories/${story.slug || story.id}`}
          className="grid cursor-pointer gap-4 rounded-2xl border border-gray-200 bg-white p-3 transition-colors hover:border-[#006C5E]/40 md:grid-cols-[160px_1fr] dark:border-white/10 dark:bg-[#0d1f1c] dark:hover:border-[#4ADE80]/40"
        >
          <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-[#f3f6f4] md:aspect-auto dark:bg-white/5">
            {story.coverImage ? (
              <Image
                src={story.coverImage}
                alt={story.title}
                fill
                loader={imageLoader}
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                <FileText className="h-7 w-7" />
              </div>
            )}
          </div>
          <div className="flex flex-col justify-center">
            <h3 className="text-lg font-semibold text-[#101827] dark:text-white">{story.title}</h3>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
              {story.shortDesc || 'A CookTale kitchen story.'}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

function SavedGrid({
  bookmarks,
  type,
  total,
  loading,
  onTypeChange,
  onRemove,
  onLoadMore,
}: {
  bookmarks: ProfileBookmark[];
  type: 'all' | 'recipes' | 'stories';
  total: number;
  loading: boolean;
  onTypeChange: (type: 'all' | 'recipes' | 'stories') => void;
  onRemove: (bookmark: ProfileBookmark) => void;
  onLoadMore: () => void;
}) {
  return (
    <section>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[#101827] dark:text-white">Saved items</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Recipes and stories you want to return to.
          </p>
        </div>
        <div className="flex rounded-xl border border-gray-200 p-1 dark:border-white/10">
          {(['all', 'recipes', 'stories'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onTypeChange(option)}
              className={`cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                type === option
                  ? 'bg-[#006C5E] text-white dark:bg-[#4ADE80] dark:text-[#0d1f1c]'
                  : 'text-gray-500 hover:text-[#006C5E] dark:text-gray-400 dark:hover:text-[#4ADE80]'
              }`}
            >
              {option === 'all' ? 'All' : option === 'recipes' ? 'Recipes' : 'Stories'}
            </button>
          ))}
        </div>
      </div>

      {loading && !bookmarks.length ? (
        <div className="py-16 text-center text-sm text-gray-500 dark:text-gray-400">Loading saved items...</div>
      ) : !bookmarks.length ? (
        <EmptyState type="bookmarks" />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {bookmarks.map((bookmark) => (
              <SavedCard key={bookmark.id} bookmark={bookmark} onRemove={() => onRemove(bookmark)} />
            ))}
          </div>
          {bookmarks.length < total && <LoadMoreButton loading={loading} onClick={onLoadMore} />}
        </>
      )}
    </section>
  );
}

function SavedCard({ bookmark, onRemove }: { bookmark: ProfileBookmark; onRemove: () => void }) {
  const recipe = bookmark.recipe;
  const story = bookmark.story;
  const href = recipe?.slug ? `/recipe/${recipe.slug}` : story?.slug ? `/stories/${story.slug}` : null;
  if (!href) return null;

  const title = recipe?.name || story?.title || 'Saved item';
  const image = recipe?.mainImage || story?.coverImage || null;
  const isRecipe = Boolean(recipe);

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/10 dark:bg-[#0d1f1c]">
      <Link href={href} className="block cursor-pointer">
        <div className="relative aspect-[4/3] bg-[#f3f6f4] dark:bg-white/5">
          {image ? (
            <Image src={image} alt={title} fill loader={imageLoader} className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              {isRecipe ? <BookOpenText className="h-8 w-8" /> : <FileText className="h-8 w-8" />}
            </div>
          )}
        </div>
        <div className="p-4 pr-12">
          <p className="text-xs font-medium text-[#006C5E] dark:text-[#4ADE80]">
            {isRecipe ? 'Recipe' : 'Story'}
          </p>
          <h3 className="mt-1 line-clamp-2 text-base font-semibold text-[#101827] group-hover:text-[#006C5E] dark:text-white dark:group-hover:text-[#4ADE80]">
            {title}
          </h3>
          <p className="mt-3 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
            {isRecipe
              ? `${recipe?.totalTimeReq || 0} min${recipe?.yield ? ` · ${recipe.yield} serves` : ''}`
              : story?.shortDesc || 'A CookTale kitchen story.'}
          </p>
        </div>
      </Link>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${title} from saved items`}
        className="absolute right-3 bottom-3 cursor-pointer rounded-lg border border-gray-200 bg-white p-2 text-gray-500 transition-colors hover:border-red-200 hover:text-red-600 dark:border-white/10 dark:bg-[#0d1f1c] dark:text-gray-300 dark:hover:border-red-400/30 dark:hover:text-red-300"
      >
        <BookmarkX className="h-4 w-4" />
      </button>
    </article>
  );
}

function EmptyState({ type }: { type: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-[#fafafa] px-6 py-16 text-center dark:border-white/10 dark:bg-white/5">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-gray-400 dark:bg-white/10">
        <Bookmark className="h-5 w-5" />
      </div>
      <h3 className="text-lg font-semibold text-[#101827] dark:text-white">No {type} yet</h3>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        {type === 'bookmarks'
          ? 'Save recipes and stories to keep them here.'
          : 'When this kitchen starts publishing, it will show up here.'}
      </p>
    </div>
  );
}

function InfoPanel({ user }: { user: PublicProfile }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-[#0d1f1c]">
      <h2 className="text-sm font-semibold tracking-wide text-gray-400 uppercase">
        Kitchen Details
      </h2>
      <div className="mt-5 space-y-4 text-sm text-gray-600 dark:text-gray-300">
        <InfoRow icon={<UserRound />} text={user.signature || 'Creator'} />
        <InfoRow icon={<MapPin />} text={user.location || 'Global kitchen'} />
        <InfoRow
          icon={<Globe2 />}
          text={user.mission || 'Sharing practical food ideas with the CookTale community.'}
        />
      </div>
    </div>
  );
}

function InfoRow({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 text-[#006C5E] dark:text-[#4ADE80] [&>svg]:h-4 [&>svg]:w-4">
        {icon}
      </span>
      <span className="leading-6">{text}</span>
    </div>
  );
}

function LinkPanel({ user }: { user: PublicProfile }) {
  const links = [
    {
      label: 'Instagram',
      value: user.socialLinks?.instagram,
      icon: <ExternalLink />,
      href: user.socialLinks?.instagram
        ? `https://instagram.com/${user.socialLinks.instagram}`
        : undefined,
    },
    {
      label: 'Twitter',
      value: user.socialLinks?.twitter,
      icon: <ExternalLink />,
      href: user.socialLinks?.twitter
        ? `https://twitter.com/${user.socialLinks.twitter}`
        : undefined,
    },
    {
      label: 'YouTube',
      value: user.socialLinks?.youtube,
      icon: <ExternalLink />,
      href: user.socialLinks?.youtube,
    },
  ].filter((link) => link.value);

  if (!links.length && !user.website) return null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-[#0d1f1c]">
      <h2 className="text-sm font-semibold tracking-wide text-gray-400 uppercase">Links</h2>
      <div className="mt-4 space-y-2">
        {user.website && <ProfileLink href={user.website} label="Website" icon={<Globe2 />} />}
        {links.map((link) => (
          <ProfileLink
            key={link.label}
            href={link.href || '#'}
            label={link.label}
            icon={link.icon}
          />
        ))}
      </div>
    </div>
  );
}

function ProfileLink({ href, label, icon }: { href: string; label: string; icon: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-[#f1f7f6] hover:text-[#006C5E] dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-[#4ADE80]"
    >
      <span className="[&>svg]:h-4 [&>svg]:w-4">{icon}</span>
      <span>{label}</span>
      <ExternalLink className="ml-auto h-3.5 w-3.5 opacity-50" />
    </a>
  );
}

function AboutSection({ user }: { user: PublicProfile }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-[#0d1f1c]">
      <h2 className="text-2xl font-semibold text-[#101827] dark:text-white">About {user.name}</h2>
      <p className="mt-4 max-w-3xl text-base leading-8 text-gray-600 dark:text-gray-300">
        {user.about || 'This creator has not added a full kitchen story yet.'}
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <AboutBlock
          title="Signature"
          body={user.signature || 'A personal cooking style is coming soon.'}
        />
        <AboutBlock
          title="Mission"
          body={user.mission || 'Making everyday cooking easier to share.'}
        />
      </div>
    </div>
  );
}

function AboutBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-[#fafafa] p-5 dark:border-white/10 dark:bg-white/5">
      <h3 className="text-sm font-semibold tracking-wide text-gray-400 uppercase">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">{body}</p>
    </div>
  );
}
