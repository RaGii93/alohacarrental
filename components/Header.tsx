"use client";

import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function Header() {
  return (
    <header className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">EdgeRent Lite</h1>
        <LanguageSwitcher />
      </div>
    </header>
  );
}