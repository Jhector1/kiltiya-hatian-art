"use client";

import SEO from "@/components/SEO";
import { useState } from "react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Add your API call or form submission logic here
    alert("Message sent!");
    setFormData({ name: "", email: "", message: "" });
  };

  return (
    <>
      <SEO
        title="Haitian Digital Art Gallery"
        description="Buy and explore uniquely crafted Haitian vector artworks."
      />
      <main className="min-h-screen  flex items-center justify-center px-4 py-12">
        <div className="max-w-6xl w-full bg-white shadow-2xl rounded-3xl p-8 md:p-12 grid md:grid-cols-2 gap-10">
          {/* Left section */}
          <div className="space-y-6">
            <h2 className="text-4xl font-bold text-gray-900">Get in Touch</h2>
            <p className="text-gray-600">
              We&apos;d love to hear from you! Whether it&apos;s a question,
              feedback, or just to say hi — feel free to reach out.
            </p>

            <div className="space-y-4">
              <ContactInfo icon="✉️" text="info@ziledigital.com" />
              <ContactInfo icon="📞" text="+1 (773) 690-7299" />
              <ContactInfo
                icon="📍"
                text="123 Rue Freedom, Port-au-Prince, Haiti"
              />
            </div>
          </div>

          {/* Right section - form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium">Name</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Email</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Message</label>
              <textarea
                name="message"
                rows={4}
                required
                value={formData.message}
                onChange={handleChange}
                className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-purple-600 text-white py-2 rounded-xl hover:bg-blue-700 transition-all duration-200"
            >
              Send Message
            </button>
          </form>
        </div>
      </main>
    </>
  );
}

function ContactInfo({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-2xl">{icon}</span>
      <span className="text-gray-700">{text}</span>
    </div>
  );
}
