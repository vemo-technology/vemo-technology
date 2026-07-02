"use client";

import Link from "next/link";
import VemoPublicHeader from "@/components/site/VemoPublicHeader";
import VemoPublicFooter from "@/components/site/VemoPublicFooter";
import VemoCountryPhoneField from "@/components/site/VemoCountryPhoneField";

export default function ContactEnPage() {
  return (
    <>
      <VemoPublicHeader locale="en" />

      <VemoPublicHeader locale="en" />
<main className="vemo-public-zero-reflets min-h-screen bg-white text-[#111827]">
        <section className="mx-auto max-w-5xl px-6 py-12">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.34em] text-[#F15A24]">
              Contact
            </p>
            <h1 className="mt-3 text-[38px] font-black tracking-[-0.06em] md:text-[52px]">
              Contact Vemo Technology
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base font-bold leading-7 text-slate-600">
              Send your request. We will get back to you quickly.
            </p>
          </div>

          <div className="mx-auto mt-9 max-w-3xl rounded-[28px] border border-[#DDE7F2] bg-white p-6">
            <div className="mb-6 border-b border-[#E6EDF5] pb-5">
              <p className="text-[10px] font-black uppercase tracking-[0.26em] text-slate-400">
                Secure form
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#123A63]">
                Send a request
              </h2>
            </div>

            <form
              className="grid gap-3.5"
              onSubmit={(e) => {
                e.preventDefault();
                alert("Message prepared. Connect this form to your email/API.");
              }}
            >
              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    Full name
                  </span>
                  <input
                    required
                    className="h-12 rounded-[14px] border border-[#DDE7F2] px-4 text-sm font-bold outline-none focus:border-[#F15A24]"
                    placeholder="Your name"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    Email
                  </span>
                  <input
                    required
                    type="email"
                    className="h-12 rounded-[14px] border border-[#DDE7F2] px-4 text-sm font-bold outline-none focus:border-[#F15A24]"
                    placeholder="you@email.com"
                  />
                </label>
              </div>

              <VemoCountryPhoneField locale="en" />

              <label className="grid gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Subject
                </span>
                <select className="h-12 rounded-[14px] border border-[#DDE7F2] px-4 text-sm font-bold outline-none focus:border-[#F15A24]">
                  <option>LLC formation</option>
                  <option>Payment</option>
                  <option>EIN</option>
                  <option>Banking</option>
                  <option>Support</option>
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Message
                </span>
                <textarea
                  required
                  rows={5}
                  className="resize-none rounded-[16px] border border-[#DDE7F2] px-4 py-3 text-sm font-bold leading-6 outline-none focus:border-[#F15A24]"
                  placeholder="Describe your request..."
                />
              </label>

              <div className="mt-2 flex flex-wrap gap-3">
                <button
                  type="submit"
                  className="rounded-[14px] bg-[#F15A24] px-6 py-3.5 text-sm font-black text-white hover:bg-[#DB4F1C]"
                >
                  Send →
                </button>

                <a
                  href="https://wa.me/212708069471"
                  target="_self"
                  rel="noreferrer"
                  className="rounded-[14px] border border-[#DDE7F2] bg-white px-6 py-3.5 text-sm font-black text-[#123A63] hover:border-[#F15A24] hover:text-[#F15A24]"
                >
                  WhatsApp
                </a>

                <Link
                  href="/en/pricing"
                  className="rounded-[14px] border border-[#DDE7F2] bg-white px-6 py-3.5 text-sm font-black text-[#123A63] hover:border-[#F15A24] hover:text-[#F15A24]"
                >
                  Pricing
                </Link>
              </div>
            </form>
          </div>
        </section>

        <VemoPublicFooter locale="en" />
      </main>
    </>
  );
}
