"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

export default function Breadcrumb({ labels = {} }) {

  const pathname = usePathname();

  const isMongoId = (segment) =>
    /^[0-9a-fA-F]{24}$/.test(segment);

  const isNumber = (segment) =>
    /^\d+$/.test(segment);

  const segments = pathname
    .split("/")
    .filter(Boolean)
    .filter(
      (segment) => !isMongoId(segment) && !isNumber(segment) // ✅ remove both
    );

  return (
    <section className="w-full bg-white border-t-2 border-gray-100">
      <div className="max-w-7xl mx-auto px-4">
        <nav className="relative overflow-hidden rounded-3xl bg-white/80 px-6 py-6">

          <ol className="flex items-center flex-wrap gap-3 text-sm md:text-base text-gray-600">

            {/* HOME */}
            <li className="flex items-center gap-3">
              <span className="p-2.5 rounded-full bg-gradient-to-r from-blue-600 to-orange-500 text-white">
                <Home size={16} />
              </span>

              <Link href="/" className="font-semibold hover:text-blue-600">
                Home
              </Link>
            </li>

            {segments.map((segment, index) => {

              const href =
                "/" + segments.slice(0, index + 1).join("/");

              const isLast =
                index === segments.length - 1;

              const label =
                labels[segment] ||
                segment
                  .replace(/[-_]/g, " ")
                  .replace(/\b\w/g, (c) => c.toUpperCase());

              return (
                <li key={href} className="flex items-center gap-3">
                  <ChevronRight size={20} className="text-gray-400" />

                  {isLast ? (
                    <span className="font-bold text-blue-600">
                      {label}
                    </span>
                  ) : (
                    <Link href={href} className="hover:text-blue-600">
                      {label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
    </section>
  );
}