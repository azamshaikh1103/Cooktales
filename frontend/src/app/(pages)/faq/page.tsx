'use client';

import { useState } from 'react';
import {
  FaSearch,
  FaChevronDown,
  FaChevronUp,
  FaQuestionCircle,
  FaUserCog,
  FaUtensils,
  FaCreditCard,
  FaBug,
  FaEnvelope,
} from 'react-icons/fa';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// --- FAQ DATA ---
const FAQ_DATA = [
  {
    category: 'General',
    icon: <FaQuestionCircle />,
    items: [
      {
        q: 'What is CookTale?',
        a: "CookTale is a global community for food lovers. It's a place to discover new recipes, share your own culinary creations, and connect with chefs from around the world.",
      },
      {
        q: 'Is CookTale free to use?',
        a: "Yes! You can browse, search, and save recipes for free. We also offer a 'Sous Chef' premium membership for advanced features like nutritional analysis and ad-free browsing.",
      },
      {
        q: 'Is there a mobile app?',
        a: 'Currently, CookTale is a responsive web application optimized for mobile browsers. A native iOS and Android app is in our roadmap for late 2025.',
      },
    ],
  },
  {
    category: 'Account & Profile',
    icon: <FaUserCog />,
    items: [
      {
        q: 'How do I get verified?',
        a: 'Verification (the blue checkmark) is reserved for professional chefs, notable food bloggers, and highly active community members. You can request verification in your Settings once you reach 1,000 followers.',
      },
      {
        q: 'Can I change my username?',
        a: 'Yes, you can change your username once every 30 days from your Profile Settings page.',
      },
      {
        q: 'How do I delete my account?',
        a: "We'd hate to see you go, but you can permanently delete your account and data from the 'Danger Zone' in your Settings. This action is irreversible.",
      },
    ],
  },
  {
    category: 'Recipes & Content',
    icon: <FaUtensils />,
    items: [
      {
        q: 'How do I post a recipe?',
        a: "Click the 'New Recipe' button in the navigation bar. You’ll need to be logged in. Our editor allows you to add ingredients, steps, photos, and even video guides.",
      },
      {
        q: 'What happens if I edit a published recipe?',
        a: 'Edits are updated immediately. However, if you make significant changes to a recipe that has been featured, it may undergo a quick re-review by our moderation team.',
      },
      {
        q: 'Can I save recipes offline?',
        a: "Offline access is currently a feature limited to our 'Sous Chef' premium members.",
      },
    ],
  },
  {
    category: 'Membership & Billing',
    icon: <FaCreditCard />,
    items: [
      {
        q: "What is included in the 'Sous Chef' plan?",
        a: 'You get an ad-free experience, unlimited collections, nutritional breakdowns, ingredient scaling tools, and priority support.',
      },
      {
        q: 'Can I cancel my subscription?',
        a: 'Absolutely. You can cancel anytime from your Billing Settings. You will retain access until the end of your current billing cycle.',
      },
      {
        q: 'Do you offer refunds?',
        a: 'We offer a 30-day money-back guarantee if you are not satisfied with the premium features. Contact support to process this.',
      },
    ],
  },
  {
    category: 'Troubleshooting',
    icon: <FaBug />,
    items: [
      {
        q: "Images aren't loading, what do I do?",
        a: 'Please check your internet connection first. If the issue persists, try clearing your browser cache. Note that we use high-quality images, so they may take a moment on slower connections.',
      },
      {
        q: 'I found a bug, how do I report it?',
        a: "Please use the 'Report a Bug' button on our Contact page, or email bugs@cooktale.in with screenshots and details.",
      },
    ],
  },
];

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openItems, setOpenItems] = useState<string[]>([]);

  // Toggle Accordion
  const toggleItem = (id: string) => {
    if (openItems.includes(id)) {
      setOpenItems(openItems.filter((item) => item !== id));
    } else {
      setOpenItems([...openItems, id]);
    }
  };

  // Filter Logic
  const filteredData = FAQ_DATA.map((cat) => ({
    ...cat,
    items: cat.items.filter(
      (item) =>
        item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.a.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((cat) => cat.items.length > 0);

  return (
    <div className="flex min-h-screen flex-col bg-[#fafafa] text-gray-900 transition-colors duration-500 dark:bg-[#0d1f1c] dark:text-white">
      <Navbar />

      <main className="relative grow pt-24 pb-20 lg:pt-32">
        {/* --- BACKGROUNDS --- */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/2 h-[600px] w-[1000px] -translate-x-1/2 rounded-full bg-[#006C5E]/5 blur-[120px] dark:bg-[#006C5E]/20" />
          <div className="pointer-events-none fixed top-1/3 right-0 translate-x-1/4 opacity-[0.03] select-none dark:opacity-[0.02]">
            <span className="text-[20vw] font-black">HELP</span>
          </div>
        </div>

        <div className="relative z-10 container mx-auto px-6 lg:px-24">
          {/* --- HERO HEADER --- */}
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-xs font-bold tracking-widest text-[#006C5E] uppercase transition-colors dark:border-white/10 dark:bg-white/5 dark:text-[#4ADE80]">
              <FaQuestionCircle /> Support Center
            </div>

            <h1 className="mb-6 text-4xl leading-tight font-black lg:text-6xl">
              How can we <br />
              <span className="text-[#006C5E] dark:text-[#4ADE80]">help you?</span>
            </h1>

            {/* Search Bar */}
            <div className="group relative mx-auto max-w-xl">
              <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-gray-500 transition-colors group-focus-within:text-[#006C5E] dark:group-focus-within:text-[#4ADE80]">
                <FaSearch />
              </div>
              <input
                type="text"
                placeholder="Search for answers (e.g. 'billing', 'upload')..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border-2 border-gray-200 bg-white py-4 pr-4 pl-12 font-bold text-gray-800 shadow-lg transition-all outline-none focus:border-[#006C5E] dark:border-white/10 dark:bg-[#152a26] dark:text-white dark:focus:border-[#4ADE80]"
              />
            </div>
          </div>

          {/* --- FAQ GRID --- */}
          <div className="mx-auto max-w-4xl space-y-12">
            {filteredData.length > 0 ? (
              filteredData.map((section, idx) => (
                <div key={idx} className="animate-fade-in-up">
                  {/* Section Title */}
                  <div className="mb-6 flex items-center gap-3 border-b border-gray-200 pb-2 dark:border-white/10">
                    <span className="text-xl text-[#006C5E] dark:text-[#4ADE80]">
                      {section.icon}
                    </span>
                    <h3 className="text-2xl font-bold">{section.category}</h3>
                  </div>

                  {/* Accordion Items */}
                  <div className="space-y-4">
                    {section.items.map((item, i) => {
                      const isOpen = openItems.includes(`${idx}-${i}`);
                      return (
                        <div
                          key={i}
                          onClick={() => toggleItem(`${idx}-${i}`)}
                          className={`cursor-pointer overflow-hidden rounded-2xl border transition-all duration-300 ${
                            isOpen
                              ? 'border-[#006C5E]/30 bg-white shadow-lg dark:border-[#4ADE80]/30 dark:bg-[#1a2c29]'
                              : 'border-gray-100 bg-white hover:border-gray-300 dark:border-white/5 dark:bg-white/5 dark:hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4 p-5">
                            <h4
                              className={`text-lg font-bold ${
                                isOpen
                                  ? 'text-[#006C5E] dark:text-[#4ADE80]'
                                  : 'text-gray-800 dark:text-gray-200'
                              }`}
                            >
                              {item.q}
                            </h4>
                            <div
                              className={`shrink-0 text-gray-500 transition-transform duration-300 ${
                                isOpen ? 'rotate-180 text-[#006C5E] dark:text-[#4ADE80]' : ''
                              }`}
                            >
                              <FaChevronDown />
                            </div>
                          </div>
                          <div
                            className={`overflow-hidden transition-all duration-300 ease-in-out ${
                              isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                            }`}
                          >
                            <p className="border-t border-gray-100 px-5 pt-4 pb-5 leading-relaxed text-gray-600 dark:border-white/5 dark:text-gray-500">
                              {item.a}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center opacity-50">
                <p className="mb-2 text-2xl">🤔</p>
                <p>No results found for "{searchQuery}"</p>
              </div>
            )}
          </div>

          {/* --- CONTACT CTA --- */}
          <div className="relative mx-auto mt-24 max-w-3xl overflow-hidden rounded-[2.5rem] border border-gray-100 bg-white p-10 text-center shadow-xl dark:border-white/5 dark:bg-[#152a26]">
            <div className="relative z-10">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-2xl text-gray-500 dark:bg-white/10 dark:text-white">
                <FaEnvelope />
              </div>
              <h3 className="mb-4 text-3xl font-bold">Still stumped?</h3>
              <p className="mx-auto mb-8 max-w-md text-gray-500 dark:text-gray-500">
                Can't find the answer you're looking for? Our support team is ready to help you out.
              </p>
              <a
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full bg-[#006C5E] px-8 py-3 font-bold text-white transition-all hover:scale-105 hover:bg-[#005a4e] dark:bg-[#4ADE80] dark:text-[#0d1f1c] dark:hover:bg-[#3ccb74]"
              >
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
