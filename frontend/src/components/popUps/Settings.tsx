'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import {
  FaCamera,
  FaCheckCircle,
  FaCreditCard,
  FaCrown,
  FaDownload,
  FaEnvelope,
  FaExternalLinkAlt,
  FaFileInvoiceDollar,
  FaGithub,
  FaGoogle,
  FaHistory,
  FaInstagram,
  FaSpinner,
  FaTimesCircle,
  FaYoutube,
} from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import {
  FiBell,
  FiCheck,
  FiCreditCard,
  FiEye,
  FiEyeOff,
  FiGlobe,
  FiLoader,
  FiLock,
  FiLogOut,
  FiSettings,
  FiToggleLeft,
  FiToggleRight,
  FiUser,
  FiX,
} from 'react-icons/fi';
import { RiVipCrownFill } from 'react-icons/ri';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { ApiClientError } from '@/lib/api/authClient';
import { profileClient, type UpdateProfileInput } from '@/lib/api/profileClient';
import {
  browserPushPermission,
  disableBrowserPush,
  enableBrowserPush,
  isBrowserPushSupported,
  sendBrowserPushTest,
} from '@/lib/notifications/browserPush';
import { useAuth } from '@/lib/auth/AuthContext';
import { useCloudinaryUpload } from '@/lib/hooks/useCloudinaryUpload';
import imageLoader from '@/lib/loader';
import { setSettingsPopup } from '@/lib/Slices/SettingsSlice';
import type { RootState } from '@/lib/store';
import UpgradeModal from '../UpgradeModal';

// --- TYPES ---
type Tab = 'profile' | 'account' | 'preferences' | 'notifications' | 'billing' | 'danger';

type SaveBarState = {
  loading: boolean;
  disabled?: boolean;
  onSave: () => void;
};

const SettingsSaveBarContext = createContext<Dispatch<SetStateAction<SaveBarState | null>> | null>(null);

function useSettingsSaveBar() {
  const setSaveBar = useContext(SettingsSaveBarContext);
  if (!setSaveBar) throw new Error('Settings save bar is unavailable.');
  return setSaveBar;
}

export default function SettingsModal() {
  const dispatch = useDispatch();
  const isOpen = useSelector((state: RootState) => state.settings.isSettingsPopupActive);
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [saveBar, setSaveBar] = useState<SaveBarState | null>(null);

  if (!isOpen) return null;

  // Menu Configuration
  const MENU_ITEMS = [
    { id: 'profile', label: 'Public Profile', icon: FiUser },
    { id: 'account', label: 'Account & Security', icon: FiLock },
    { id: 'preferences', label: 'App Preferences', icon: FiSettings },
    { id: 'notifications', label: 'Notifications', icon: FiBell },
    { id: 'billing', label: 'Billing & Plan', icon: FiCreditCard },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-70 flex items-end justify-center p-0 sm:items-center sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => dispatch(setSettingsPopup(false))}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative flex h-[min(760px,100dvh)] w-full max-w-5xl flex-col overflow-hidden rounded-t-[2rem] border border-gray-100 bg-white shadow-2xl md:h-[700px] md:flex-row md:rounded-[2.5rem] dark:border-white/10 dark:bg-[#0d1f1c]"
        >
          {/* --- LEFT: SIDEBAR --- */}
          <div className="flex w-full shrink-0 flex-col border-b border-gray-200 bg-gray-50/80 p-4 backdrop-blur-xl md:w-72 md:border-r md:border-b-0 md:p-6 dark:border-white/5 dark:bg-[#152a26]/80">
            <div className="mb-4 flex items-center gap-3 pl-1 md:mb-8 md:pt-2 md:pl-2">
              <div className="rounded-xl bg-[#006C5E] p-2.5 text-white dark:bg-[#4ADE80] dark:text-black">
                <FiSettings size={22} />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">Settings</span>
            </div>

            <nav className="no-scrollbar flex flex-1 gap-1 overflow-x-auto md:flex-col md:space-y-1 md:overflow-y-auto">
              {MENU_ITEMS.map((item) => (
                <NavButton
                  key={item.id}
                  id={item.id}
                  label={item.label}
                  icon={item.icon}
                  active={activeTab}
                  onClick={setActiveTab}
                />
              ))}

              <div className="hidden md:mx-2 md:my-4 md:block md:h-px md:bg-gray-200 dark:md:bg-white/10" />

              <NavButton
                id="danger"
                label="Account actions"
                icon={FiLogOut}
                active={activeTab}
                onClick={setActiveTab}
                danger
              />
            </nav>

            {/* Mini Footer */}
            <div className="hidden md:mt-6 md:block md:px-4 md:text-xs md:font-medium md:text-gray-500">CookTale · v1.0.4</div>
          </div>

          {/* --- RIGHT: CONTENT AREA --- */}
          <div className="relative flex min-h-0 flex-1 flex-col bg-white dark:bg-[#0d1f1c]">
            {/* Close Button */}
            <button
              type="button"
              aria-label="Close"
              onClick={() => dispatch(setSettingsPopup(false))}
              className="absolute top-3 right-3 z-10 cursor-pointer rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 md:top-6 md:right-6 dark:text-gray-500 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <FiX size={24} />
            </button>

            {/* Scrollable Content */}
            <SettingsSaveBarContext.Provider value={setSaveBar}>
              <div className="custom-scrollbar flex-1 overflow-y-auto p-5 pt-16 sm:p-8 sm:pt-16 md:p-12">
                <div className="mx-auto max-w-3xl">
                  {activeTab === 'profile' && <ProfileTab />}
                  {activeTab === 'account' && <AccountTab />}
                  {activeTab === 'preferences' && <PreferencesTab />}
                  {activeTab === 'notifications' && <NotificationsTab />}
                  {activeTab === 'billing' && <BillingTab />}
                  {activeTab === 'danger' && <DangerTab />}
                </div>
              </div>
              {saveBar && (
                <div className="flex shrink-0 justify-end border-t border-gray-100 bg-white px-5 py-4 shadow-[0_-8px_18px_rgba(0,0,0,0.04)] sm:px-8 md:px-12 dark:border-white/10 dark:bg-[#0d1f1c] dark:shadow-[0_-8px_18px_rgba(0,0,0,0.18)]">
                  <SaveButton
                    onClick={saveBar.onSave}
                    loading={saveBar.loading}
                    disabled={saveBar.disabled}
                  />
                </div>
              )}
            </SettingsSaveBarContext.Provider>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// --- 1. PROFILE TAB ---
export const ProfileTab = () => {
  const { uploadFile, deleteAsset } = useCloudinaryUpload();
  const { updateUser } = useAuth();
  const setSaveBar = useSettingsSaveBar();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  type ProfileForm = {
    name: string;
    username: string;
    about: string;
    image: string;
    imagePublicId: string;
    socialLinks: { instagram: string; twitter: string; youtube: string };
  };

  // Form State
  const [formData, setFormData] = useState<ProfileForm>({
    name: '',
    username: '',
    about: '',
    image: '',
    imagePublicId: '',
    socialLinks: { instagram: '', twitter: '', youtube: '' },
  });
  const [savedFormData, setSavedFormData] = useState<ProfileForm | null>(null);

  // New States for Username Check
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'loading' | 'valid' | 'invalid'>(
    'idle'
  );
  const [usernameMessage, setUsernameMessage] = useState('');

  // Debounce Effect
  useEffect(() => {
    const checkUsername = setTimeout(async () => {
      // Skip if empty or hasn't changed from initial load (optional optimization)
      if (!formData.username || formData.username === savedFormData?.username) {
        setUsernameStatus('idle');
        setUsernameMessage('');
        return;
      }

      setUsernameStatus('loading');

      const res = await profileClient.checkUsernameAvailability(formData.username);

      if (res.available) {
        setUsernameStatus('valid');
        setUsernameMessage('');
      } else {
        setUsernameStatus('invalid');
        setUsernameMessage(res.message || 'Unavailable');
      }
    }, 500); // Wait 500ms after typing stops

    return () => clearTimeout(checkUsername);
  }, [formData.username, savedFormData?.username]);

  // ... rest of component ...

  // Update the Save Button to disable if username is invalid
  const usernameHasChanged = formData.username !== savedFormData?.username;
  const profileHasChanges = Boolean(
    savedFormData &&
      (formData.name !== savedFormData.name ||
        formData.username !== savedFormData.username ||
        formData.about !== savedFormData.about ||
        JSON.stringify(formData.socialLinks) !== JSON.stringify(savedFormData.socialLinks)),
  );
  const isSaveDisabled =
    loading || (usernameHasChanged && (usernameStatus === 'invalid' || usernameStatus === 'loading'));

  // Fetch latest data on mount (Single Source of Truth)
  useEffect(() => {
    const loadData = async () => {
      const data = await profileClient.me().catch(() => null);
      if (data?.user) {
        const nextFormData = {
          name: data.user.name || '',
          username: data.user.username || '',
          about: data.user.about || '',
          image: data.user.image || '',
          imagePublicId: data.user.imagePublicId || '',
          socialLinks: (data.user.socialLinks as ProfileForm['socialLinks']) || {
            instagram: '',
            twitter: '',
            youtube: '',
          },
        };
        setFormData(nextFormData);
        setSavedFormData(nextFormData);
      }
      setFetching(false);
    };
    loadData();
  }, []);

  const handleSave = async () => {
    if (!savedFormData) return;

    const changes: UpdateProfileInput = {};
    if (formData.name !== savedFormData.name) changes.name = formData.name;
    if (formData.username !== savedFormData.username) changes.username = formData.username;
    if (formData.about !== savedFormData.about) changes.about = formData.about;
    if (JSON.stringify(formData.socialLinks) !== JSON.stringify(savedFormData.socialLinks)) {
      changes.socialLinks = formData.socialLinks;
    }

    if (Object.keys(changes).length === 0) {
      toast.message('There are no profile changes to save.');
      return;
    }

    setLoading(true);
    try {
      const result = await profileClient.updateMe(changes);
      updateUser({
        name: result.user.name,
        username: result.user.username,
        image: result.user.image,
      });
      setSavedFormData(formData);
      toast.success('Profile updated successfully.');
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : 'Failed to update profile.');
    }
    setLoading(false);
  };

  const profileSaveRef = useRef(handleSave);
  profileSaveRef.current = handleSave;

  useEffect(() => {
    setSaveBar(
      profileHasChanges
        ? { loading, disabled: isSaveDisabled, onSave: () => void profileSaveRef.current() }
        : null,
    );
    return () => setSaveBar(null);
  }, [isSaveDisabled, loading, profileHasChanges, setSaveBar]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      if (!file.type.startsWith('image/')) {
        toast.error('Please choose an image file.');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Profile picture must be under 5MB.');
        return;
      }

      const res = await uploadFile({
        file,
        context: 'USER_AVATAR',
        resourceType: 'image',
      });
      if (res) {
        try {
          const result = await profileClient.updateMe({
            image: res.publicUrl,
            imagePublicId: res.publicId,
          });
          updateUser({
            image: result.user.image,
            name: result.user.name,
            username: result.user.username,
          });
        } catch (error) {
          await deleteAsset({
            publicId: res.publicId,
            resourceType: 'image',
          });
          throw error;
        }
        setFormData((prev) => ({
          ...prev,
          image: res.publicUrl,
          imagePublicId: res.publicId,
        }));
        setSavedFormData((prev) =>
          prev ? { ...prev, image: res.publicUrl, imagePublicId: res.publicId } : prev,
        );
        toast.success('Profile picture updated.');
      }
    } catch (e) {
      toast.error(e instanceof ApiClientError ? e.message : 'Profile picture upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  if (fetching)
    return (
      <div className="flex h-64 items-center justify-center text-gray-400">
        <FiLoader className="animate-spin text-2xl" />
      </div>
    );

  return (
    <div className="animate-fade-in space-y-10">
      <Header title="Public Profile" desc="Manage how you appear to other chefs on CookTale." />

      {/* Avatar Section */}
      <div className="flex items-center gap-6 border-b border-gray-100 pb-8 dark:border-white/5">
        <div className="group relative h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-gray-200 dark:border-[#152a26] dark:bg-white/10">
          {formData.image ? (
            <Image src={formData.image} fill alt="" className="object-cover" loader={imageLoader} />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-400 dark:text-gray-500">
              <FiUser className="h-8 w-8" />
            </div>
          )}

          {/* Upload overlay */}
          <label
            className={`absolute inset-0 flex cursor-pointer items-center justify-center bg-black/40 transition-opacity ${
              isUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            <input
              type="file"
              className="hidden"
              accept="image/jpeg,image/png,image/webp"
              disabled={isUploading}
              onChange={handleImageUpload}
            />
            {isUploading ? (
              <FiLoader className="animate-spin text-white" />
            ) : (
              <FaCamera className="text-white" />
            )}
          </label>
        </div>
        <div>
          <h4 className="text-lg font-bold text-gray-900 dark:text-white">Profile Picture</h4>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            {isUploading ? 'Uploading your picture…' : 'JPG, PNG, or WebP. Maximum 5MB.'}
          </p>
        </div>
      </div>

      {/* Inputs */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <InputGroup
            label="Display Name"
            value={formData.name}
            onChange={(v: string) => setFormData({ ...formData, name: v })}
            placeholder="e.g. Chef Ramsey"
          />
          <InputGroup
            label="Username"
            value={formData.username}
            onChange={(v: string) => setFormData({ ...formData, username: v })}
            placeholder="e.g. MeowMaster007"
            status={usernameStatus}
            statusMessage={usernameMessage}
          />
        </div>

        <TextAreaGroup
          label="Bio"
          value={formData.about}
          onChange={(v: string) => setFormData({ ...formData, about: v })}
          placeholder="Brief bio about yourself..."
        />

        {/* Socials */}
        <div className="pt-4">
          <label className="mb-3 block text-xs font-bold tracking-wider text-gray-400 uppercase">
            Social Connections
          </label>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <InputGroup
              label="Instagram"
              value={formData.socialLinks.instagram}
              onChange={(v: string) =>
                setFormData({
                  ...formData,
                  socialLinks: { ...formData.socialLinks, instagram: v },
                })
              }
              placeholder="username"
              prefix={<FaInstagram className="text-pink-500" />}
            />
            <InputGroup
              label="X"
              value={formData.socialLinks.twitter}
              onChange={(v: string) =>
                setFormData({
                  ...formData,
                  socialLinks: { ...formData.socialLinks, twitter: v },
                })
              }
              placeholder="username"
              prefix={<FaXTwitter className="text-black dark:text-white" />}
            />
            <InputGroup
              label="YouTube"
              value={formData.socialLinks.youtube}
              onChange={(v: string) =>
                setFormData({
                  ...formData,
                  socialLinks: { ...formData.socialLinks, youtube: v },
                })
              }
              placeholder="channel"
              prefix={<FaYoutube className="text-red-500" />}
            />
          </div>
        </div>
      </div>

    </div>
  );
};

// --- 2. ACCOUNT TAB (Security) ---
export const AccountTab = () => {
  const [passData, setPassData] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [loading, setLoading] = useState(false);

  const handlePasswordUpdate = async () => {
    if (passData.new !== passData.confirm) return toast.error('New passwords do not match');
    if (passData.new.length < 8) return toast.error('Password is too short (min 8 chars)');

    setLoading(true);
    try {
      const res = await profileClient.changePassword({
        currentPassword: passData.current,
        newPassword: passData.new,
      });
      toast.success(res.message);
      setPassData({ current: '', new: '', confirm: '' }); // Reset fields
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : 'Failed to change password.');
    }
    setLoading(false);
  };

  return (
    <div className="animate-fade-in space-y-10">
      <Header
        title="Account & Security"
        desc="Manage your login details and secure your account."
      />

      {/* Password Update */}
      <section className="space-y-4">
        <h4 className="text-sm font-bold tracking-wider text-gray-400 uppercase">
          Change Password
        </h4>
        <div className="space-y-6 rounded-3xl border border-gray-200 bg-white p-8 dark:border-white/5 dark:bg-white/5">
          <InputGroup
            label="Current Password"
            type="password"
            placeholder="••••••••"
            value={passData.current}
            onChange={(v: string) => setPassData({ ...passData, current: v })}
          />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <InputGroup
              label="New Password"
              type="password"
              placeholder="••••••••"
              value={passData.new}
              onChange={(v: string) => setPassData({ ...passData, new: v })}
            />
            <InputGroup
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              value={passData.confirm}
              onChange={(v: string) => setPassData({ ...passData, confirm: v })}
            />
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handlePasswordUpdate}
              disabled={loading}
              className="cursor-pointer text-sm font-bold text-[#006C5E] transition-colors hover:text-[#005349] disabled:cursor-not-allowed disabled:opacity-50 dark:text-[#4ADE80] dark:hover:text-[#3ccb74]"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </div>
      </section>

      {/* 2FA Placeholder */}
      <section className="space-y-4">
        <h4 className="text-sm font-bold tracking-wider text-gray-400 uppercase">
          Two-Factor Authentication
        </h4>
        <div className="flex items-center justify-between rounded-3xl border border-gray-200 bg-gray-50 p-6 opacity-70 dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-white p-3 text-gray-400 dark:bg-white/10">
              <FiLock />
            </div>
            <div>
              <h4 className="text-sm font-bold tracking-wide text-gray-900 dark:text-white">
                Authenticator App
              </h4>
              <p className="text-xs text-gray-500">Secure your account with Google Auth.</p>
            </div>
          </div>
          <span className="rounded-full bg-gray-200 px-3 py-1 text-[10px] font-bold tracking-widest text-gray-500 uppercase dark:bg-white/10">
            Coming Soon
          </span>
        </div>
      </section>
    </div>
  );
};
// --- 3. PREFERENCES TAB ---
export const PreferencesTab = () => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const setSaveBar = useSettingsSaveBar();

  // State
  const [settings, setSettings] = useState({
    measurementSystem: 'METRIC',
    language: 'English',
    timezone: '(GMT+00:00) UTC',
    dietaryPreferences: 'Omnivore',
    appSettings: {
      autoplay: true,
      screenAwake: false,
    },
  });
  const [savedSettings, setSavedSettings] = useState<typeof settings | null>(null);

  // Load Data
  useEffect(() => {
    const loadData = async () => {
      const data = await profileClient.me().catch(() => null);
      if (data?.user) {
        const appSettings = (data.user.appSettings as any) || {};
        const nextSettings = {
          measurementSystem: data.user.measurementSystem || 'METRIC',
          language: data.user.language || 'English',
          timezone: data.user.timezone || '(GMT+00:00) UTC',
          dietaryPreferences: data.user.dietaryPreferences || 'Omnivore',
          appSettings: {
            autoplay: appSettings.autoplay ?? true,
            screenAwake: appSettings.screenAwake ?? false,
          },
        };
        setSettings(nextSettings);
        setSavedSettings(nextSettings);
      } else {
        setSavedSettings(settings);
      }
      setFetching(false);
    };
    loadData();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await profileClient.updatePreferences(settings);
      setSavedSettings(settings);
      toast.success('Preferences saved.');
    } catch (error) {
      toast.error(
        error instanceof ApiClientError ? error.message : 'Failed to update preferences.'
      );
    }
    setLoading(false);
  };

  const preferencesHaveChanges = Boolean(
    savedSettings && JSON.stringify(settings) !== JSON.stringify(savedSettings),
  );

  const preferencesSaveRef = useRef(handleSave);
  preferencesSaveRef.current = handleSave;

  useEffect(() => {
    setSaveBar(
      preferencesHaveChanges ? { loading, onSave: () => void preferencesSaveRef.current() } : null,
    );
    return () => setSaveBar(null);
  }, [loading, preferencesHaveChanges, setSaveBar]);

  // Handlers
  const toggleSetting = (key: 'autoplay' | 'screenAwake') => {
    setSettings((prev) => ({
      ...prev,
      appSettings: { ...prev.appSettings, [key]: !prev.appSettings[key] },
    }));
  };

  if (fetching)
    return (
      <div className="flex h-64 items-center justify-center text-gray-400">
        <FiLoader className="animate-spin text-2xl" />
      </div>
    );

  return (
    <div className="animate-fade-in space-y-10">
      <Header
        title="App Preferences"
        desc="Customize your CookTale experience to fit your kitchen."
      />

      {/* 1. Dietary DNA */}
      <section className="space-y-4">
        <h4 className="ml-1 text-xs font-bold tracking-wider text-gray-400 uppercase">
          Dietary DNA
        </h4>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {['Omnivore', 'Vegetarian', 'Vegan', 'Pescatarian', 'Keto', 'Gluten Free'].map((diet) => (
            <button
              type="button"
              key={diet}
              onClick={() => setSettings({ ...settings, dietaryPreferences: diet })}
              className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition-colors duration-200 ${
                settings.dietaryPreferences === diet
                  ? 'border-[#006C5E] bg-[#006C5E] text-white dark:border-[#4ADE80] dark:bg-[#4ADE80] dark:text-[#0d1f1c]'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-white/10 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10'
              }`}
            >
              {diet === settings.dietaryPreferences && <FiCheck className="text-lg" />}
              {diet}
            </button>
          ))}
        </div>
        <p className="px-1 text-[10px] text-gray-400">
          We'll prioritize recipes that match your diet.
        </p>
      </section>

      {/* 2. Cooking Settings */}
      <section className="space-y-4">
        <h4 className="ml-1 text-xs font-bold tracking-wider text-gray-400 uppercase">
          Cooking Environment
        </h4>
        <div className="space-y-6 rounded-4xl border border-gray-200 bg-white p-6 dark:border-white/5 dark:bg-white/5">
          {/* Metric/Imperial Switch */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-gray-900 dark:text-white">Measurement System</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                How recipes should display units.
              </p>
            </div>
            <div className="flex rounded-xl bg-gray-100 p-1 dark:bg-black/40">
              <button
                type="button"
                onClick={() => setSettings({ ...settings, measurementSystem: 'METRIC' })}
                className={`cursor-pointer rounded-lg px-4 py-1.5 text-xs font-bold transition-colors ${
                  settings.measurementSystem === 'METRIC'
                    ? 'bg-white text-gray-900 dark:bg-[#2a2a2a] dark:text-white'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-500'
                }`}
              >
                Metric (g/ml)
              </button>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, measurementSystem: 'IMPERIAL' })}
                className={`cursor-pointer rounded-lg px-4 py-1.5 text-xs font-bold transition-colors ${
                  settings.measurementSystem === 'IMPERIAL'
                    ? 'bg-white text-gray-900 dark:bg-[#2a2a2a] dark:text-white'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-500'
                }`}
              >
                Imperial (oz/lb)
              </button>
            </div>
          </div>

          <div className="h-px bg-gray-100 dark:bg-white/5" />

          <ToggleRowWrapper
            label="Autoplay Videos"
            desc="Play recipe videos automatically when connected to Wi-Fi."
            active={settings.appSettings.autoplay}
            onToggle={() => toggleSetting('autoplay')}
          />

          <ToggleRowWrapper
            label="Screen Awake"
            desc="Prevent screen from dimming while you are in Cook Mode."
            active={settings.appSettings.screenAwake}
            onToggle={() => toggleSetting('screenAwake')}
          />
        </div>
      </section>

      {/* 3. Localization */}
      <section className="space-y-4">
        <h4 className="ml-1 text-xs font-bold tracking-wider text-gray-400 uppercase">
          Localization
        </h4>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <SelectGroup
            label="Language"
            options={['English', 'Spanish', 'French']}
            value={settings.language}
            onChange={(v: string) => setSettings({ ...settings, language: v })}
          />
          <SelectGroup
            label="Timezone"
            options={[
              '(GMT-05:00) Eastern Time',
              '(GMT+00:00) UTC',
              '(GMT+05:30) India Standard Time',
            ]}
            value={settings.timezone}
            onChange={(v: string) => setSettings({ ...settings, timezone: v })}
          />
        </div>
      </section>

    </div>
  );
};

// Helper to make the toggle interactive inside this component
const ToggleRowWrapper = ({ label, desc, active, onToggle }: any) => (
  <div className="group flex cursor-pointer items-center justify-between" onClick={onToggle}>
    <div>
      <h5 className="font-bold text-gray-900 transition-colors group-hover:text-[#006C5E] dark:text-white dark:group-hover:text-[#4ADE80]">
        {label}
      </h5>
      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{desc}</p>
    </div>
    <button
      type="button"
      className={`cursor-pointer text-3xl transition-colors ${active ? 'text-[#006C5E] dark:text-[#4ADE80]' : 'text-gray-300 dark:text-gray-600'}`}
    >
      {active ? <FiToggleRight /> : <FiToggleLeft />}
    </button>
  </div>
);

// --- 4. NOTIFICATIONS TAB ---
export const NotificationsTab = () => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [testingBrowserAlert, setTestingBrowserAlert] = useState(false);
  const setSaveBar = useSettingsSaveBar();

  // State with Defaults
  const [notifs, setNotifs] = useState({
    in_app_follows: true,
    in_app_likes: true,
    in_app_comments: true,
    in_app_reviews: true,
    in_app_system: true,
    email_activity_digest: false,
    push_activity: false,
  });
  const [savedNotifs, setSavedNotifs] = useState<typeof notifs | null>(null);

  // 1. Fetch Data
  useEffect(() => {
    const loadData = async () => {
      const data = await profileClient.me().catch(() => null);
      if (data?.user?.notificationPreferences) {
        // Merge with defaults in case new keys were added to the schema later
        const nextNotifs = {
          in_app_follows: true,
          in_app_likes: true,
          in_app_comments: true,
          in_app_reviews: true,
          in_app_system: true,
          email_activity_digest: false,
          push_activity: false,
          ...(data.user.notificationPreferences as any),
        };
        setNotifs(nextNotifs);
        setSavedNotifs(nextNotifs);
      } else {
        setSavedNotifs(notifs);
      }
      setFetching(false);
    };
    loadData();
  }, []);

  // 2. Save Handler
  const handleSave = async () => {
    setLoading(true);
    try {
      const wantsBrowserAlerts = notifs.push_activity;

      // Persist every ordinary preference first. Browser registration is an external
      // browser-provider step, so it must never block the rest of the settings.
      await profileClient.updateNotifications({ ...notifs, push_activity: false });

      if (!wantsBrowserAlerts) {
        await disableBrowserPush().catch(() => undefined);
        setSavedNotifs(notifs);
        toast.success('Notification settings updated.');
        return;
      }

      try {
        await enableBrowserPush();
        await profileClient.updateNotifications({ ...notifs, push_activity: true });
        setSavedNotifs(notifs);
        toast.success('Notification settings updated.');
      } catch (error) {
        const saved = { ...notifs, push_activity: false };
        setNotifs(saved);
        setSavedNotifs(saved);
        const reason = error instanceof Error ? error.message : 'The browser could not register.';
        toast.error(`Other settings were saved. Browser alerts were not enabled: ${reason}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update notifications.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Toggle Logic
  const toggle = (key: keyof typeof notifs) => {
    setNotifs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const notificationsHaveChanges = Boolean(
    savedNotifs && JSON.stringify(notifs) !== JSON.stringify(savedNotifs),
  );

  const notificationsSaveRef = useRef(handleSave);
  notificationsSaveRef.current = handleSave;

  useEffect(() => {
    setSaveBar(
      notificationsHaveChanges ? { loading, onSave: () => void notificationsSaveRef.current() } : null,
    );
    return () => setSaveBar(null);
  }, [loading, notificationsHaveChanges, setSaveBar]);

  const handleBrowserAlertTest = async () => {
    setTestingBrowserAlert(true);
    try {
      await sendBrowserPushTest();
      toast.success('Test browser alert sent.');
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'The browser could not show the test alert.';
      toast.error(reason);
    } finally {
      setTestingBrowserAlert(false);
    }
  };

  if (fetching)
    return (
      <div className="flex h-64 items-center justify-center text-gray-400">
        <FiLoader className="animate-spin text-2xl" />
      </div>
    );

  return (
    <div className="animate-fade-in space-y-8">
      <Header title="Notifications" desc="Choose what we update you on." />

      <div className="space-y-8 rounded-4xl border border-gray-200 bg-white p-8 dark:border-white/5 dark:bg-white/5">
        <div className="space-y-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-[#006C5E]/10 p-2 text-[#006C5E] dark:bg-[#4ADE80]/10 dark:text-[#4ADE80]">
              <FiBell />
            </div>
            <h4 className="text-sm font-bold tracking-wider text-gray-500 uppercase dark:text-gray-400">
              In-App Activity
            </h4>
          </div>
          <ToggleRowWrapper
            label="New Followers"
            desc="When someone starts following your kitchen."
            active={notifs.in_app_follows}
            onToggle={() => toggle('in_app_follows')}
          />
          <ToggleRowWrapper
            label="Likes"
            desc="When someone likes your recipe or story."
            active={notifs.in_app_likes}
            onToggle={() => toggle('in_app_likes')}
          />
          <ToggleRowWrapper
            label="Comments & Replies"
            desc="When someone joins a conversation around your work."
            active={notifs.in_app_comments}
            onToggle={() => toggle('in_app_comments')}
          />
          <ToggleRowWrapper
            label="Recipe Reviews"
            desc="When someone reviews your recipe or replies to your review."
            active={notifs.in_app_reviews}
            onToggle={() => toggle('in_app_reviews')}
          />
        </div>

        <div className="h-px w-full bg-gray-100 dark:bg-white/5" />

        {/* EMAIL SECTION */}
        <div className="space-y-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-[#006C5E]/10 p-2 text-[#006C5E] dark:bg-[#4ADE80]/10 dark:text-[#4ADE80]">
              <FaEnvelope />
            </div>
            <h4 className="text-sm font-bold tracking-wider text-gray-500 uppercase dark:text-gray-400">
              Daily Email Digest
            </h4>
          </div>

          <ToggleRowWrapper
            label="Kitchen activity"
            desc="One daily summary of unread follows, likes, comments, and reviews."
            active={notifs.email_activity_digest}
            onToggle={() => toggle('email_activity_digest')}
          />
        </div>

        <div className="h-px w-full bg-gray-100 dark:bg-white/5" />

        <div className="space-y-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-[#006C5E]/10 p-2 text-[#006C5E] dark:bg-[#4ADE80]/10 dark:text-[#4ADE80]">
              <FiBell />
            </div>
            <h4 className="text-sm font-bold tracking-wider text-gray-500 uppercase dark:text-gray-400">
              Browser Alerts
            </h4>
          </div>

          <ToggleRowWrapper
            label="Kitchen activity"
            desc={
              !isBrowserPushSupported()
                ? 'Browser alerts are not supported on this device.'
                : browserPushPermission() === 'denied'
                  ? 'Alerts are blocked by this browser. Allow them in site settings first.'
                  : 'Alerts in this browser for new follows, likes, comments, and reviews.'
            }
            active={notifs.push_activity}
            onToggle={() => toggle('push_activity')}
          />
          <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 px-4 py-3 dark:border-white/10">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Check that this browser can visibly show CookTale alerts.
            </p>
            <button
              type="button"
              onClick={() => void handleBrowserAlertTest()}
              disabled={testingBrowserAlert || browserPushPermission() !== 'granted'}
              className="shrink-0 cursor-pointer rounded-lg border border-[#006C5E] px-3 py-2 text-xs font-semibold text-[#006C5E] transition-colors hover:bg-[#006C5E] hover:text-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#4ADE80] dark:text-[#4ADE80] dark:hover:bg-[#4ADE80] dark:hover:text-[#0d1f1c]"
            >
              {testingBrowserAlert ? 'Sending...' : 'Send test alert'}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

// --- COMPONENTS ---

const StatusBadge = ({ active, label }: { active: boolean; label: string }) => (
  <div
    className={`flex items-center gap-3 rounded-2xl border p-4 transition-colors ${
      active
        ? 'border-[#bfe8d4] bg-[#f3fbf7] dark:border-[#4ADE80]/25 dark:bg-[#4ADE80]/10'
        : 'border-gray-200 bg-white opacity-75 dark:border-white/10 dark:bg-white/5'
    }`}
  >
    <div
      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm ${
        active ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500 dark:bg-white/10'
      }`}
    >
      {active ? <FaCheckCircle /> : <FaTimesCircle />}
    </div>
    <div>
      <p className="text-xs font-bold tracking-wider text-gray-400 uppercase dark:text-gray-500">
        Feature
      </p>
      <p className="text-sm font-bold text-gray-900 dark:text-white">{label}</p>
    </div>
  </div>
);

const QuickAction = ({ icon, label, onClick, loading }: any) => (
  <button
    type="button"
    onClick={onClick}
    disabled={loading}
    className="group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border border-gray-100 bg-white p-6 transition-colors hover:border-[#006C5E]/30 dark:border-white/5 dark:bg-[#152a26] dark:hover:border-[#4ADE80]/30"
  >
    <div className="text-2xl text-gray-400 transition-colors group-hover:text-[#006C5E] dark:group-hover:text-[#4ADE80]">
      {icon}
    </div>
    <span className="text-sm font-bold text-gray-600 dark:text-gray-300">{label}</span>
  </button>
);

export const BillingTab = () => {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [planDetails, setPlanDetails] = useState<any>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    profileClient
      .me()
      .then((data) => {
        setPlanDetails(data.user);
        setFetching(false);
      })
      .catch(() => {
        setPlanDetails(null);
        setFetching(false);
      });
  }, []);

  // Derived State
  const isPro = planDetails?.isPro && planDetails?.planStatus === 'ACTIVE';
  const isCanceled = planDetails?.planStatus === 'CANCELED';
  const renewalDate = planDetails?.planEndsAt
    ? new Date(planDetails.planEndsAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'N/A';

  if (fetching)
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-64 rounded-[2.5rem] bg-gray-200 dark:bg-white/5" />
        <div className="h-32 rounded-3xl bg-gray-100 dark:bg-white/5" />
      </div>
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-10 pb-10"
    >
      <div>
        <h2 className="mb-2 text-3xl font-black text-gray-900 dark:text-white">Membership</h2>
        <p className="text-gray-500 dark:text-gray-400">
          Manage your subscription plan and billing.
        </p>
      </div>

      {/* --- 1. THE MEMBERSHIP CARD --- */}
      <div
        className={`relative overflow-hidden rounded-[2rem] p-8 transition-colors lg:p-10 ${
          isPro
            ? 'border border-[#006C5E]/20 bg-[#006C5E] text-white dark:border-[#4ADE80]/20'
            : 'border border-gray-200 bg-white dark:border-white/5 dark:bg-[#152a26]'
        }`}
      >
        {/* Decor */}
        {isPro && (
          <>
            <div className="pointer-events-none absolute top-0 right-0 h-64 w-64 translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10" />
          </>
        )}

        <div className="relative z-10 flex max-w-xl flex-col items-start gap-7">
          <div className="flex items-center gap-3">
            <div
              className={`rounded-lg border px-3 py-1 text-[10px] font-bold tracking-widest uppercase ${
                isPro
                  ? 'border-white/20 bg-white/20 text-white'
                  : 'border-gray-200 bg-gray-100 text-gray-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-400'
              }`}
            >
              {isCanceled ? 'Expiring Soon' : 'Current Plan'}
            </div>
            {isPro && <FaCrown className="animate-pulse text-lg text-amber-400" />}
          </div>

          <div>
            <h3
              className={`text-4xl font-semibold lg:text-5xl ${!isPro && 'text-gray-900 dark:text-white'}`}
            >
              {isPro ? 'Sous Chef' : 'Guest Pass'}
            </h3>

            <p
              className={`mt-3 max-w-md text-sm font-medium ${isPro ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}
            >
              {isPro
                ? `Your kitchen is fully unlocked. Next billing date: ${renewalDate}.`
                : isCanceled
                  ? `Your access remains active until ${renewalDate}. Resubscribe to keep your streak.`
                  : 'You are currently on the free tier with limited access to premium recipes.'}
            </p>
          </div>

          {isPro || isCanceled ? (
            <button
              type="button"
              onClick={() => toast.info('Billing portal will move with the payment module.')}
              className="flex cursor-pointer items-center gap-2 rounded-xl bg-white px-8 py-3 text-sm font-bold text-[#006C5E] transition-colors hover:bg-gray-100"
            >
              Manage Plan <FaExternalLinkAlt className="text-xs" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowUpgrade(true)}
              className="cursor-pointer rounded-full border border-[#006C5E] bg-[#006C5E] px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#005a4e] dark:border-[#4ADE80] dark:bg-[#4ADE80] dark:text-[#0d1f1c] dark:hover:bg-[#35c96b]"
            >
              Upgrade Now
            </button>
          )}
        </div>
      </div>

      {/* --- 2. ACTIVE BENEFITS GRID --- */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatusBadge active={isPro} label="Ad-Free Experience" />
        <StatusBadge active={isPro} label="Unlimited Collections" />
        <StatusBadge active={isPro} label="Advanced Nutrition Data" />
        <StatusBadge active={isPro} label="Chef AI Assistant" />
        <StatusBadge active={true} label="Community Access" />
        <StatusBadge active={isPro} label="Cook Mode" />
        <StatusBadge active={isPro} label="Advanced Analytics" />
        <StatusBadge active={isPro} label="Verified Badge" />
        <StatusBadge active={isPro} label="Early Updates" />
      </div>

      {/* --- 3. QUICK ACTIONS (Portal Deep Links) --- */}
      {(isPro || isCanceled) && (
        <div>
          <h3 className="mb-6 text-lg font-bold text-gray-900 dark:text-white">Billing Actions</h3>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <QuickAction
              icon={<FaFileInvoiceDollar />}
              label="Invoices"
              onClick={() => toast.info('Billing portal will move with the payment module.')}
            />
            <QuickAction
              icon={<FaCreditCard />}
              label="Payment Method"
              onClick={() => toast.info('Billing portal will move with the payment module.')}
            />
            <QuickAction
              icon={<FaHistory />}
              label="Billing History"
              onClick={() => toast.info('Billing portal will move with the payment module.')}
            />
            <QuickAction
              icon={<RiVipCrownFill />}
              label={isCanceled ? 'Reactivate' : 'Change Plan'}
              onClick={() => toast.info('Billing portal will move with the payment module.')}
            />
          </div>
          <p className="mt-6 text-center text-xs text-gray-400">
            All billing actions are securely handled by our payment partner, LemonSqueezy.
          </p>
        </div>
      )}

      {/* Upgrade Modal (For Free Users) */}
      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} plan="yearly" />
    </motion.div>
  );
};

// --- 6. DANGER TAB ---
export const DangerTab = () => {
  const router = useRouter();
  const { logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isDeleteConfirm, setIsDeleteConfirm] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const res = await profileClient.exportData();
      // Trigger Download
      const blob = new Blob([JSON.stringify(res.data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cooktale-data.json';
      a.click();
      toast.success('Data exported successfully.');
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : 'Failed to export data.');
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    // Step 1: Ask for confirmation
    if (!isDeleteConfirm) {
      setIsDeleteConfirm(true);
      return;
    }

    // Step 2: Execute
    setLoading(true);
    try {
      await profileClient.deactivateMe();
      toast.success('Account scheduled for deletion.');
      await logout();
      router.push('/');
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : 'Failed to delete account.');
      setIsDeleteConfirm(false);
    }
    setLoading(false);
  };

  return (
    <div className="animate-fade-in space-y-8">
      <Header title="Account actions" desc="Sign out, download your data, or close your account." />

      <div className="space-y-4">
        {/* 1. LOGOUT */}
        <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white">Log Out</h4>
            <p className="mt-1 text-xs text-gray-500">Sign out of your account on this device.</p>
          </div>
          <button
            type="button"
            onClick={async () => {
              await logout();
              router.push('/');
            }}
            className="cursor-pointer rounded-xl border border-gray-200 px-5 py-2 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50 dark:border-white/10 dark:text-white dark:hover:bg-white/10"
          >
            Log Out
          </button>
        </div>

        {/* 2. EXPORT DATA (New Pro Feature) */}
        <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white">Export Data</h4>
            <p className="mt-1 text-xs text-gray-500">
              Download a copy of all your recipes and profile data.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExport}
            disabled={loading}
            className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 px-5 py-2 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-white dark:hover:bg-white/10"
          >
            {loading ? <FiLoader className="animate-spin" /> : <FaDownload />} Export
          </button>
        </div>

        {/* 3. DELETE ACCOUNT */}
        <div
          className={`flex items-center justify-between rounded-2xl border p-5 transition-colors duration-300 ${isDeleteConfirm ? 'border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-900/20' : 'border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-900/10'}`}
        >
          <div>
            <h4 className="flex items-center gap-2 font-bold text-red-700 dark:text-red-400">
              Delete Account
              {isDeleteConfirm && (
                <span className="rounded bg-red-200 px-2 py-0.5 text-[10px] tracking-wide text-red-800 uppercase dark:bg-red-900/50 dark:text-red-200">
                  Are you sure?
                </span>
              )}
            </h4>
            <p className="mt-1 max-w-xs text-xs text-red-600/70 dark:text-red-400/70">
              {isDeleteConfirm
                ? 'This will deactivate your account immediately. Data is wiped after 30 days.'
                : 'Permanently remove your account and all data.'}
            </p>
          </div>

          <div className="flex gap-2">
            {isDeleteConfirm && (
              <button
                type="button"
                onClick={() => setIsDeleteConfirm(false)}
                className="cursor-pointer rounded-xl px-4 py-2 text-sm font-bold text-gray-500 transition-colors hover:bg-white/50"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="cursor-pointer rounded-xl bg-red-600 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Processing...' : isDeleteConfirm ? 'Confirm Delete' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- HELPER COMPONENTS ---

const NavButton = ({ id, label, icon: Icon, active, onClick, danger }: any) => (
  <button
    type="button"
    onClick={() => onClick(id)}
    className={`group relative flex shrink-0 cursor-pointer items-center gap-3 overflow-hidden rounded-2xl px-4 py-3 transition-colors duration-200 md:w-full md:gap-4 md:py-3.5 ${
      active === id
        ? danger
          ? 'border border-red-200 bg-red-50 text-red-600 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400'
          : 'border border-[#bfe8d4] bg-[#eef8f4] text-[#006C5E] dark:border-white/10 dark:bg-white/10 dark:text-white'
        : danger
          ? 'text-red-400 hover:bg-red-50/50 dark:hover:bg-red-900/10'
          : 'border border-transparent text-gray-500 hover:bg-white hover:text-gray-900 dark:text-gray-500 dark:hover:bg-white/5 dark:hover:text-white'
    } `}
  >
    <Icon size={18} className={active === id ? '' : 'opacity-70'} />
    <span className="text-sm font-bold">{label}</span>
    {active === id && !danger && (
      <motion.div
        layoutId="active-indicator"
        className="absolute top-1/2 left-0 h-8 w-1 -translate-y-1/2 rounded-r-full bg-[#006C5E] dark:bg-[#4ADE80]"
      />
    )}
  </button>
);

const SelectGroup = ({ label, options, value, onChange }: any) => (
  <div>
    <label className="mb-2 ml-1 block text-xs font-bold tracking-wider text-gray-500 uppercase dark:text-gray-500">
      {label}
    </label>
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        className="w-full cursor-pointer appearance-none rounded-xl border border-gray-200 bg-gray-50 px-5 py-3.5 font-medium text-gray-900 transition-colors outline-none focus:border-[#006C5E] dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-[#4ADE80]"
      >
        {options.map((opt: string) => (
          <option key={opt}>{opt}</option>
        ))}
      </select>
      <div className="pointer-events-none absolute top-4 right-4 text-gray-500">▼</div>
    </div>
  </div>
);

const ToggleRow = ({ label, desc, active }: any) => (
  <div className="flex items-center justify-between">
    <div>
      <h5 className="font-bold text-gray-900 dark:text-white">{label}</h5>
      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-500">{desc}</p>
    </div>
    <button
      type="button"
      aria-label={label}
      className={`cursor-pointer text-3xl transition-colors ${
        active ? 'text-[#006C5E] dark:text-[#4ADE80]' : 'text-gray-300 dark:text-gray-600'
      }`}
    >
      {active ? <FiToggleRight /> : <FiToggleLeft />}
    </button>
  </div>
);

const FooterActions = () => (
  <div className="flex justify-end gap-3 border-t border-gray-100 pt-6 dark:border-white/10">
    <button
      type="button"
      className="cursor-pointer rounded-xl px-6 py-3 text-sm font-bold text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-500 dark:hover:bg-white/5"
    >
      Cancel
    </button>
    <button
      type="button"
      className="cursor-pointer rounded-xl bg-[#006C5E] px-8 py-3 text-sm font-bold text-white transition-colors hover:bg-[#005a4e] dark:bg-[#4ADE80] dark:text-black dark:hover:bg-[#3ccb74]"
    >
      Save Changes
    </button>
  </div>
);

// ============ HELPER COMPONENTS (Copy these!) ============

const Header = ({ title, desc }: { title: string; desc: string }) => (
  <div>
    <h2 className="mb-2 text-3xl font-black text-gray-900 dark:text-white">{title}</h2>
    <p className="text-gray-500 dark:text-gray-400">{desc}</p>
  </div>
);

// Update props definition to accept status
const InputGroup = ({
  label,
  value,
  onChange,
  placeholder,
  prefix,
  readOnly,
  type = 'text',
  status,
  statusMessage, // <--- New Props
}: any) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;
  // Determine border color based on status
  let borderColor =
    'border-gray-200 dark:border-white/10 focus:border-[#006C5E] dark:focus:border-[#4ADE80]';
  if (status === 'invalid') borderColor = 'border-red-500 focus:border-red-500';
  if (status === 'valid') borderColor = 'border-green-500 focus:border-green-500';

  return (
    <div className="w-full">
      <label className="mb-2 ml-1 block text-xs font-bold tracking-wider text-gray-400 uppercase dark:text-gray-500">
        {label}
      </label>

      <div className="group relative">
        {/* Prefix */}
        {prefix && (
          <span className="absolute top-3.5 left-4 z-10 flex h-full items-center pb-7 text-sm font-medium text-gray-400 select-none">
            {prefix}
          </span>
        )}

        <input
          type={inputType}
          value={value}
          readOnly={readOnly}
          onChange={(e) => onChange && onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-2xl border bg-white font-medium text-gray-900 transition-all outline-none placeholder:text-gray-300 focus:ring-1 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-600 ${borderColor} ${prefix ? (typeof prefix === 'string' ? 'pl-36' : 'pl-12') : 'px-5'} py-3.5 pr-10 ${readOnly ? 'cursor-not-allowed bg-gray-50 opacity-60 dark:bg-white/5' : ''} `}
        />

        {/* Status Icons (Absolute Right) */}
        <div className="absolute top-1/2 right-4 -translate-y-1/2 text-sm">
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="cursor-pointer text-gray-400 transition-colors hover:text-[#006C5E] dark:hover:text-[#4ADE80]"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          )}
          {status === 'loading' && (
            <FaSpinner className="animate-spin text-[#006C5E] dark:text-[#4ADE80]" />
          )}
          {status === 'valid' && <FaCheckCircle className="text-green-500" />}
          {status === 'invalid' && <FaTimesCircle className="text-red-500" />}
        </div>
      </div>
      {statusMessage && (
        <p className="mt-1 min-h-5 text-xs font-medium text-red-500">{statusMessage}</p>
      )}
    </div>
  );
};

const TextAreaGroup = ({ label, value, onChange, placeholder }: any) => (
  <div className="w-full">
    <label className="mb-2 ml-1 block text-xs font-bold tracking-wider text-gray-400 uppercase dark:text-gray-500">
      {label}
    </label>
    <textarea
      value={value}
      onChange={(e) => onChange && onChange(e.target.value)}
      placeholder={placeholder}
      rows={3}
      className="w-full resize-none rounded-2xl border border-gray-200 bg-white px-5 py-3.5 font-medium text-gray-900 transition-all outline-none placeholder:text-gray-300 focus:border-[#006C5E] focus:ring-1 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-600 dark:focus:border-[#4ADE80] dark:focus:ring-white"
    />
  </div>
);

const SaveButton = ({
  onClick,
  loading,
  disabled = false,
}: {
  onClick: () => void;
  loading: boolean;
  disabled?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={loading || disabled}
    className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#006C5E] px-8 py-3 text-sm font-bold text-white transition-colors hover:bg-[#005a4e] disabled:cursor-not-allowed disabled:opacity-70 dark:bg-[#4ADE80] dark:text-black dark:hover:bg-[#3ccb74]"
  >
    {loading ? (
      <>
        <FiLoader className="animate-spin" /> Saving...
      </>
    ) : (
      <>
        <FiCheck /> Save Changes
      </>
    )}
  </button>
);
