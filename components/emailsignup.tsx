"use client";

import { useState } from "react";

type FormState = {
  full_name: string;
  company: string;
  role: string;
  email: string;
};

export default function EmailSignup() {
  const [form, setForm] = useState<FormState>({
    full_name: "",
    company: "",
    role: "",
    email: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Something went wrong.");
      }

      setMessage("Access is limited. Submit a work email to request entry.");
      setIsError(false);

      setForm({
        full_name: "",
        company: "",
        role: "",
        email: "",
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Network error. Please try again shortly.";
      setMessage(errorMessage);
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="full_name"
          className="mb-2 block text-xs font-medium uppercase tracking-[0.25em] text-white/70"
        >
          Full Name
        </label>
        <input
          id="full_name"
          type="text"
          name="full_name"
          placeholder="Ava Reynolds"
          value={form.full_name}
          onChange={handleChange}
          required
          className="w-full rounded-lg border border-gray-600 bg-black/20 p-3 text-white placeholder:text-white/40 outline-none transition focus:border-white/60"
        />
      </div>

      <div>
        <label
          htmlFor="company"
          className="mb-2 block text-xs font-medium uppercase tracking-[0.25em] text-white/70"
        >
          Company
        </label>
        <input
          id="company"
          type="text"
          name="company"
          placeholder="Atlas Macro"
          value={form.company}
          onChange={handleChange}
          required
          className="w-full rounded-lg border border-gray-600 bg-black/20 p-3 text-white placeholder:text-white/40 outline-none transition focus:border-white/60"
        />
      </div>

      <div>
        <label
          htmlFor="role"
          className="mb-2 block text-xs font-medium uppercase tracking-[0.25em] text-white/70"
        >
          Role
        </label>
        <input
          id="role"
          type="text"
          name="role"
          placeholder="Founder"
          value={form.role}
          onChange={handleChange}
          required
          className="w-full rounded-lg border border-gray-600 bg-black/20 p-3 text-white placeholder:text-white/40 outline-none transition focus:border-white/60"
        />
      </div>

      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-xs font-medium uppercase tracking-[0.25em] text-white/70"
        >
          Work Email
        </label>
        <input
          id="email"
          type="email"
          name="email"
          placeholder="alexa@fundname.com"
          value={form.email}
          onChange={handleChange}
          required
          className="w-full rounded-lg border border-gray-600 bg-black/20 p-3 text-white placeholder:text-white/40 outline-none transition focus:border-white/60"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-white py-3 font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Submitting..." : "Request Access"}
      </button>

      {message ? (
        <p className={`text-sm ${isError ? "text-red-400" : "text-white/70"}`}>
          {message}
        </p>
      ) : null}
    </form>
  );
}