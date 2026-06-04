"use client";
import { useState } from "react";

export default function Tabs({ tabs = [] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="w-full">
      {/* Tab buttons */}
      <div className="flex gap-6  pb-2">
        {tabs.map((tab, index) => {
          const isActive = activeIndex === index;

          return (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`relative px-2 py-2 text-sm transition-all duration-300
                ${
                  isActive
                    ? "text-blue-600 font-semibold"
                    : "text-gray-500 hover:text-gray-800"
                }
              `}
            >
              {tab.label}

              {/* Active underline */}
              {isActive && (
                <span className="absolute left-0 -bottom-[9px] h-[3px] w-full rounded-full bg-blue-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="">
        {tabs[activeIndex] && tabs[activeIndex].content}
      </div>
    </div>
  );
}
