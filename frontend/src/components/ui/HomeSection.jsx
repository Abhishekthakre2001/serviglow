"use client";

import React, { useState, useEffect } from "react";

/* ================= HELPERS ================= */
const isValidColor = (color) =>
  /^#([0-9A-F]{3}){1,2}$/i.test(color);

const isValidPhone = (phone) =>
  /^[+]?[\d\s-]{10,15}$/.test(phone);

/* ================= CHIP ================= */
const EditableChip = ({ value, onDelete, onUpdate }) => {
  const [edit, setEdit] = useState(false);
  const [text, setText] = useState(value);

  const save = () => {
    if (!text.trim()) return;
    onUpdate(text);
    setEdit(false);
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-gray-300 rounded-full text-sm">
      {edit ? (
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => e.key === "Enter" && save()}
          className="bg-transparent outline-none w-28"
          autoFocus
        />
      ) : (
        <span onClick={() => setEdit(true)} className="cursor-pointer">
          {value}
        </span>
      )}
      <button onClick={onDelete} className="text-gray-400 hover:text-red-500">
        ✕
      </button>
    </div>
  );
};

/* ================= MAIN ================= */
export default function HomeSectionContent({
  initialData = {},
  onSave,
  loading = false,
}) {
  const [data, setData] = useState({
    whyChooseUs: {
      heading: "",
      points: [],
    },
    quickSupport: {
      heading: "",
      description: "",
      phoneNumber: "",
    },
    ...initialData,
  });

  const [pointInput, setPointInput] = useState("");
  const [initialState, setInitialState] = useState("");

  /* ================= DIRTY CHECK ================= */
  const clean = (d) => ({
    ...d,
    whyChooseUs: {
      ...d.whyChooseUs,
      points: d.whyChooseUs.points.map((p) => ({ text: p.text })),
    },
  });


  const isDirty =
    JSON.stringify(clean(data)) !== initialState;

  /* ================= UI ================= */

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      <div>
        <h1 className="text-2xl font-semibold text-gray-800">
          Home Section Management
        </h1>
      </div>

      <div className="bg-white shadow-lg rounded-2xl p-6 space-y-6">

        {/* ================= WHY CHOOSE US ================= */}
        <Section title="Why Choose Us">

          <Field label="Heading">
            <Input
              value={data.whyChooseUs.heading}
              onChange={(val) =>
                setData({
                  ...data,
                  whyChooseUs: {
                    ...data.whyChooseUs,
                    heading: val,
                  },
                })
              }
            />
          </Field>



          {/* POINTS */}
          <Field label="Points">
            <InputWithButton
              value={pointInput}
              setValue={setPointInput}
              placeholder="Enter point"
              onAdd={() => {
                if (!pointInput.trim()) return;

                setData((prev) => ({
                  ...prev,
                  whyChooseUs: {
                    ...prev.whyChooseUs,
                    points: [
                      ...prev.whyChooseUs.points,
                      { text: pointInput },
                    ],
                  },
                }));

                setPointInput("");
              }}
            />

            <EditableChips
              items={data.whyChooseUs.points}
              getLabel={(i) => i.text}
              onDelete={(i) =>
                setData((prev) => ({
                  ...prev,
                  whyChooseUs: {
                    ...prev.whyChooseUs,
                    points: prev.whyChooseUs.points.filter(
                      (_, idx) => idx !== i
                    ),
                  },
                }))
              }
              onUpdate={(i, val) =>
                setData((prev) => {
                  const updated = [...prev.whyChooseUs.points];
                  updated[i].text = val;
                  return {
                    ...prev,
                    whyChooseUs: {
                      ...prev.whyChooseUs,
                      points: updated,
                    },
                  };
                })
              }
            />
          </Field>
        </Section>

        {/* ================= QUICK SUPPORT ================= */}
        <Section title="Quick Support">

          <Field label="Heading">
            <Input
              value={data.quickSupport.heading}
              onChange={(val) =>
                setData({
                  ...data,
                  quickSupport: {
                    ...data.quickSupport,
                    heading: val,
                  },
                })
              }
            />
          </Field>

          <Field label="Description">
            <Textarea
              value={data.quickSupport.description}
              onChange={(val) =>
                setData({
                  ...data,
                  quickSupport: {
                    ...data.quickSupport,
                    description: val,
                  },
                })
              }
            />
          </Field>

          <Field label="Phone Number">
            <Input
              value={data.quickSupport.phoneNumber}
              onChange={(val) =>
                setData({
                  ...data,
                  quickSupport: {
                    ...data.quickSupport,
                    phoneNumber: val,
                  },
                })
              }
            />
          </Field>


        </Section>

        {/* SAVE */}
        <div className="flex justify-end pt-4 border-t border-gray-300">
          <button
            disabled={!isDirty || loading}
            onClick={() => onSave?.(data)}
            className={`px-6 py-2.5 rounded-full text-white font-medium transition
              ${!isDirty || loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-orange-500 hover:scale-105"
              }`}
          >
            {loading
              ? "Saving..."
              : isDirty
                ? "Update Section"
                : "Saved"}
          </button>
        </div>

      </div>
    </div>
  );
}

/* ================= REUSABLE ================= */

const Section = ({ title, children }) => (
  <div className="border border-gray-300 rounded-xl p-5 bg-gray-50 space-y-4">
    <h2 className="text-sm font-semibold text-gray-700 uppercase">
      {title}
    </h2>
    {children}
  </div>
);

const Field = ({ label, children }) => (
  <div>
    <label className="text-sm text-gray-600 mb-1 block">
      {label}
    </label>
    {children}
  </div>
);

const Grid = ({ children }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    {children}
  </div>
);

const Input = ({ value, onChange, placeholder }) => (
  <input
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
  />
);

const Textarea = ({ value, onChange }) => (
  <textarea
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[90px]"
  />
);

const InputWithButton = ({
  value,
  setValue,
  placeholder,
  onAdd,
}) => (
  <div className="flex gap-2">
    <Input value={value} onChange={setValue} placeholder={placeholder} />
    <button
      onClick={onAdd}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
    >
      Add
    </button>
  </div>
);

const EditableChips = ({ items, getLabel, onDelete, onUpdate }) => (
  <div className="flex flex-wrap gap-2 mt-1 mb-1">
    {items.map((item, i) => (
      <EditableChip
        key={i}
        value={getLabel(item)}
        onDelete={() => onDelete(i)}
        onUpdate={(val) => onUpdate(i, val)}
      />
    ))}
  </div>
);