'use client';

import { useState } from 'react';
import {
  FaClock,
  FaEnvelope,
  FaMapMarkerAlt,
  FaPhone,
  FaPaperPlane,
  FaBug,
  FaLightbulb,
  FaHandshake,
} from 'react-icons/fa';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { sendContactMessage } from '@/lib/api/contactClient';
import { toast } from 'sonner';

export default function ContactUs() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    try {
      const res = await sendContactMessage({
        name: String(formData.get('name') || ''),
        email: String(formData.get('email') || ''),
        subject: String(formData.get('subject') || ''),
        message: String(formData.get('message') || ''),
      });
      toast.success(res.message);
      form.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send message.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#fafafa] transition-colors duration-500 dark:bg-[#0d1f1c]">
      <Navbar />

      <main className="relative grow pt-24 pb-20 lg:pt-32">
        {/* --- BACKGROUNDS --- */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 h-[800px] w-[800px] rounded-full bg-[#006C5E]/5 blur-[120px] dark:bg-[#006C5E]/20" />
          <div className="absolute bottom-0 left-0 h-[600px] w-[600px] rounded-full bg-orange-100/40 blur-[100px] dark:bg-orange-900/10" />
        </div>

        <div className="relative z-10 container mx-auto px-6 lg:px-24">
          {/* --- HEADER --- */}
          <div className="mx-auto mb-16 max-w-3xl text-center lg:mb-24">
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#006C5E]/10 text-3xl text-[#006C5E] shadow-sm dark:bg-[#006C5E]/20 dark:text-[#4ADE80]">
              <FaEnvelope />
            </div>
            <h1 className="mb-6 text-4xl leading-tight font-black text-gray-900 lg:text-6xl dark:text-white">
              Let's Talk <br />
              <span className="text-[#006C5E] dark:text-[#4ADE80]">Food & Tech.</span>
            </h1>
            <p className="text-lg leading-relaxed text-gray-500 dark:text-gray-500">
              Got a burning question or a spicy suggestion? We are all ears. Choose a topic below or
              send us a direct message.
            </p>
          </div>

          {/* --- QUICK ACTIONS GRID --- */}
          <div className="mb-20 grid grid-cols-1 gap-6 md:grid-cols-3">
            <QuickAction
              icon={<FaBug />}
              title="Report a Bug"
              desc="Something broken in the kitchen?"
            />
            <QuickAction
              icon={<FaLightbulb />}
              title="Feature Request"
              desc="Have a brilliant idea?"
            />
            <QuickAction
              icon={<FaHandshake />}
              title="Partnerships"
              desc="Want to cook up a deal?"
            />
          </div>

          {/* --- MAIN CONTACT SECTION (Split View) --- */}
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-24">
            {/* LEFT: Info & Map */}
            <div className="space-y-12">
              <div>
                <h3 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
                  Contact Info
                </h3>
                <div className="space-y-6">
                  <ContactRow
                    icon={<FaEnvelope />}
                    title="Email"
                    value="contact@cooktale.in"
                    href="mailto:contact@cooktale.in"
                  />
                  <ContactRow
                    icon={<FaPhone />}
                    title="Phone"
                    value="+91 (555) 123-4567"
                    href="tel:+915551234567"
                  />
                  <ContactRow icon={<FaMapMarkerAlt />} title="HQ" value="Mumbai, India" />
                  <ContactRow icon={<FaClock />} title="Support" value="24/7 Response Time" />
                </div>
              </div>

              {/* Abstract Map Placeholder */}
              <div className="group relative h-64 w-full overflow-hidden rounded-4xl border border-gray-200 bg-gray-200 dark:border-white/10 dark:bg-white/5">
                <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg')] bg-cover opacity-20 grayscale dark:opacity-10" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <span className="relative flex h-6 w-6">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#006C5E] opacity-75"></span>
                    <span className="relative inline-flex h-6 w-6 rounded-full border-2 border-white bg-[#006C5E] dark:border-[#0d1f1c]"></span>
                  </span>
                </div>
                <div className="absolute bottom-4 left-4 rounded-xl bg-white/90 px-4 py-2 text-xs font-bold shadow-lg backdrop-blur dark:bg-black/80">
                  CookTale HQ • Mumbai
                </div>
              </div>
            </div>

            {/* RIGHT: The Form */}
            <div className="rounded-4xl border border-gray-100 bg-white p-8 shadow-xl shadow-gray-100/50 lg:p-10 dark:border-white/5 dark:bg-[#152a26] dark:shadow-none">
              <h3 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
                Send a Message
              </h3>
              <p className="mb-8 text-sm text-gray-500 dark:text-gray-500">
                We usually reply within 2 hours.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2 md:col-span-1">
                    <label className="mb-2 block text-xs font-bold tracking-wider text-gray-500 uppercase">
                      Name
                    </label>
                    <input
                      required
                      name="name"
                      placeholder="John Doe"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 transition-colors outline-none focus:border-[#006C5E] dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-[#4ADE80]"
                    />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="mb-2 block text-xs font-bold tracking-wider text-gray-500 uppercase">
                      Email
                    </label>
                    <input
                      required
                      name="email"
                      type="email"
                      placeholder="john@example.com"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 transition-colors outline-none focus:border-[#006C5E] dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-[#4ADE80]"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold tracking-wider text-gray-500 uppercase">
                    Subject
                  </label>
                  <select
                    name="subject"
                    className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 transition-colors outline-none focus:border-[#006C5E] dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-[#4ADE80]"
                  >
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Technical Support">Technical Support</option>
                    <option value="Business Proposal">Business Proposal</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold tracking-wider text-gray-500 uppercase">
                    Message
                  </label>
                  <textarea
                    required
                    name="message"
                    rows={4}
                    placeholder="Tell us more..."
                    className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 transition-colors outline-none focus:border-[#006C5E] dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-[#4ADE80]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#006C5E] py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-[#005a4e] hover:shadow-xl dark:bg-[#4ADE80] dark:text-[#0d1f1c] dark:hover:bg-[#3ccb74]"
                >
                  {isLoading ? (
                    'Sending...'
                  ) : (
                    <>
                      Send Message{' '}
                      <FaPaperPlane className="text-sm transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// --- SUB COMPONENTS ---

const QuickAction = ({ icon, title, desc }: any) => (
  <button
    type="button"
    className="group flex items-start gap-4 rounded-3xl border border-gray-100 bg-white p-6 text-left transition-all hover:-translate-y-1 hover:border-[#006C5E]/20 hover:shadow-xl dark:border-white/5 dark:bg-[#152a26] dark:hover:bg-white/5"
  >
    <div className="rounded-xl bg-gray-50 p-3 text-gray-500 transition-colors group-hover:bg-[#006C5E] group-hover:text-white dark:bg-white/5 dark:group-hover:bg-[#4ADE80] dark:group-hover:text-black">
      {icon}
    </div>
    <div>
      <h4 className="mb-1 text-lg font-bold text-gray-900 dark:text-white">{title}</h4>
      <p className="text-sm text-gray-500 dark:text-gray-500">{desc}</p>
    </div>
  </button>
);

const ContactRow = ({ icon, title, value, href }: any) => (
  <div className="group flex items-center gap-4">
    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-100 bg-white text-xl text-[#006C5E] shadow-sm transition-colors dark:border-white/5 dark:bg-white/5 dark:text-[#4ADE80]">
      {icon}
    </div>
    <div>
      <p className="mb-0.5 text-xs font-bold tracking-wider text-gray-500 uppercase">{title}</p>
      {href ? (
        <a
          href={href}
          className="text-lg font-bold text-gray-900 transition-colors hover:text-[#006C5E] dark:text-white dark:hover:text-[#4ADE80]"
        >
          {value}
        </a>
      ) : (
        <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
      )}
    </div>
  </div>
);
