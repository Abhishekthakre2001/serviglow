"use client";

import React, { useState } from "react";
import Alert from "@/components/ui/Conformation";

/* ================= URL VALIDATOR ================= */
const isValidURL = (url) => {
  if (!url) return false;

  // allow internal routes
  if (
    url.startsWith("/") ||
    url.startsWith("#")
  ) {
    return true;
  }

  // allow full URLs
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/* ================= EDITABLE CHIP ================= */
const EditableChip = ({ value, extra, onDelete, onUpdate }) => {
  const [edit, setEdit] = useState(false);
  const [text, setText] = useState(value || "");
  const [link, setLink] = useState(extra || "");

  const startEdit = () => {
    setText(value || "");
    setLink(extra || "");
    setEdit(true);
  };

  const save = () => {
    if (!text.trim()) return;

    onUpdate(text.trim(), link.trim());
    setEdit(false);
  };

  const cancel = () => {
    setText(value || "");
    setLink(extra || "");
    setEdit(false);
  };

  return (
    <div className="px-3 py-2 bg-blue-50 border  border-gray-300 rounded-lg text-sm min-w-[180px]">

      {/* VIEW MODE */}
      {!edit ? (
        <div
          onClick={startEdit}
          className="cursor-pointer flex flex-col"
        >
          <span className="font-medium text-gray-800">
            {value}
          </span>

          {extra && (
            <span className="text-xs text-gray-500 truncate">
              {extra}
            </span>
          )}
        </div>
      ) : (
        <>
          {/* EDIT MODE */}
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full mb-2 px-2 py-1 border rounded text-sm"
            placeholder="Label"
          />

          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="w-full mb-2 px-2 py-1 border rounded text-sm"
            placeholder="Link / URL"
          />

          {/* ACTIONS */}
          <div className="flex justify-between gap-2 mt-1">

            <button
              onClick={cancel}
              className="text-xs text-gray-500 hover:text-red-500"
            >
              Cancel
            </button>

            <button
              onClick={save}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Save
            </button>

          </div>
        </>
      )}

      {/* DELETE */}
      {!edit && (
        <button
          onClick={onDelete}
          className="text-gray-400 hover:text-red-500 text-xs mt-2"
        >
          ✕ Remove
        </button>
      )}
    </div>
  );
};
/* ================= MAIN ================= */
export default function FooterContent({
  initialData = {},
  onSave,
  loading = false,
}) {
  const [footer, setFooter] = useState({
    highlights: [],
    company: { name: "", description: "", logo: "", socials: [] },
    quickLinks: [],
    contact: { companyName: "", address: "", phone: "", email: "" },
    bottom: { copyright: "", links: [] },
    ...initialData,
  });


  const isDirty =
    JSON.stringify(footer) !== JSON.stringify(initialData);
  const [highlightInput, setHighlightInput] = useState("");
  const [quickInput, setQuickInput] = useState({ label: "", link: "" });
  const [socialInput, setSocialInput] = useState({ platform: "", link: "" });
  const [bottomInput, setBottomInput] = useState({ label: "", link: "" });
  const [alertConfig, setAlertConfig] = useState({
    open: false,
    type: "error",
    title: "",
    message: "",
    onConfirm: null,
  });

  /* ================= HELPERS ================= */

  const removeItem = (key, index) => {
    setFooter((prev) => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== index),
    }));
  };

  /* ================= UI ================= */

  return (
    <>
      <Alert
        open={alertConfig.open}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() =>
          setAlertConfig((prev) => ({
            ...prev,
            open: false,
          }))
        }
        onConfirm={alertConfig.onConfirm}
      />

      <div className="max-w-6xl mx-auto space-y-6">
        {/* HEADER */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            Footer Management
          </h1>
          <p className="text-sm text-gray-500">
            Manage your website footer dynamically
          </p>
        </div>

        {/* MAIN CARD */}
        <div className="bg-white shadow-lg rounded-2xl p-6 space-y-6">
          {/* ================= HIGHLIGHTS ================= */}
          <Section title="Highlights">
            <InputWithButton
              value={highlightInput}
              setValue={setHighlightInput}
              placeholder="Enter highlight"
              onAdd={() => {
                if (!highlightInput.trim()) return;

                // if (footer.highlights.length >= 3) {
                //   setAlertConfig({
                //     open: true,
                //     type: "error",
                //     title: "Limit Reached",
                //     message: "Maximum 3 highlights allowed",
                //   });
                //   return;
                // }

                setFooter((prev) => ({
                  ...prev,
                  highlights: [...prev.highlights, { text: highlightInput }],
                }));

                setHighlightInput("");
              }}
            />

            <EditableChips
              items={footer.highlights}
              getLabel={(i) => i.text}
              onDelete={(i) => removeItem("highlights", i)}
              onUpdate={(i, val) =>
                setFooter((prev) => {
                  const updated = [...prev.highlights];
                  updated[i].text = val;
                  return { ...prev, highlights: updated };
                })
              }
            />
          </Section>

          {/* ================= COMPANY ================= */}
          <Section title="Company Information">
            <Field label="Company Name">
              <Input
                value={footer.company.name}
                onChange={(val) =>
                  setFooter({
                    ...footer,
                    company: { ...footer.company, name: val },
                  })
                }
              />
            </Field>

            <Field label="Description">
              <Textarea
                value={footer.company.description}
                onChange={(val) =>
                  setFooter({
                    ...footer,
                    company: { ...footer.company, description: val },
                  })
                }
              />
            </Field>

            <Field label="Logo URL">
              <Input
                value={footer.company.logo}
                onChange={(val) =>
                  setFooter({
                    ...footer,
                    company: { ...footer.company, logo: val },
                  })
                }
                placeholder="https://example.com/logo.png"
              />
            </Field>

            {/* LOGO PREVIEW */}
            {/* <div className="border rounded-lg p-4 bg-gray-50 text-center">
            {footer.company.logo ? (
              <img
                src={footer.company.logo}
                alt="logo"
                className="h-16 mx-auto object-contain"
              />
            ) : (
              <p className="text-sm text-gray-400">
                Logo preview will appear here
              </p>
            )}
          </div> */}

            {/* SOCIAL LINKS */}
            <Field label="Social Links">
              <InputWithButton
                value={socialInput.platform}
                setValue={(v) => setSocialInput((p) => ({ ...p, platform: v }))}
                secondValue={socialInput.link}
                setSecondValue={(v) => setSocialInput((p) => ({ ...p, link: v }))}
                placeholder="Platform"
                secondPlaceholder="Link"
                onAdd={() => {
                  if (!socialInput.platform || !socialInput.link) return;

                  if (!isValidURL(socialInput.link)) {
                    setAlertConfig({
                      open: true,
                      type: "error",
                      title: "Invalid URL",
                      message: "Please enter a valid URL",
                    });
                    return;
                  }

                  setFooter((prev) => ({
                    ...prev,
                    company: {
                      ...prev.company,
                      socials: [...prev.company.socials, socialInput],
                    },
                  }));

                  setSocialInput({ platform: "", link: "" });
                }}
              />

              <EditableChips
                items={footer.company.socials}
                getLabel={(i) => i.platform}
                getExtra={(i) => i.link}
                onDelete={(i) =>
                  setFooter((prev) => ({
                    ...prev,
                    company: {
                      ...prev.company,
                      socials: prev.company.socials.filter((_, idx) => idx !== i),
                    },
                  }))
                }
                onUpdate={(i, platform, link) =>
                  setFooter((prev) => {
                    const updated = [...prev.company.socials];
                    updated[i] = {
                      ...updated[i],
                      platform,
                      link,
                    };

                    return {
                      ...prev,
                      company: { ...prev.company, socials: updated },
                    };
                  })
                }
              />
            </Field>
          </Section>

          {/* ================= QUICK LINKS ================= */}
          <Section title="Quick Links">
            <InputWithButton
              value={quickInput.label}
              setValue={(v) => setQuickInput((p) => ({ ...p, label: v }))}
              secondValue={quickInput.link}
              setSecondValue={(v) => setQuickInput((p) => ({ ...p, link: v }))}
              placeholder="Label"
              secondPlaceholder="URL"
              onAdd={() => {
                if (!quickInput.label || !quickInput.link) return;

                if (!isValidURL(quickInput.link)) {
                  setAlertConfig({
                    open: true,
                    type: "error",
                    title: "Invalid URL",
                    message: "Please enter a valid URL",
                  });
                  return;
                }

                setFooter((prev) => ({
                  ...prev,
                  quickLinks: [...prev.quickLinks, quickInput],
                }));

                setQuickInput({ label: "", link: "" });
              }}
            />

            <EditableChips
              items={footer.quickLinks}
              getLabel={(i) => i.label}
              getExtra={(i) => i.link}
              onDelete={(i) => removeItem("quickLinks", i)}
              onUpdate={(i, label, link) =>
                setFooter((prev) => {
                  const updated = [...prev.quickLinks];
                  updated[i] = {
                    ...updated[i],
                    label,
                    link,
                  };

                  return { ...prev, quickLinks: updated };
                })
              }
            />
          </Section>

          {/* ================= CONTACT ================= */}
          <Section title="Contact Information">
            <Grid>
              <Field label="Company Name">
                <Input
                  value={footer.contact.companyName}
                  onChange={(val) =>
                    setFooter({
                      ...footer,
                      contact: {
                        ...footer.contact,
                        companyName: val,
                      },
                    })
                  }
                />
              </Field>

              <Field label="Address">
                <Input
                  value={footer.contact.address}
                  onChange={(val) =>
                    setFooter({
                      ...footer,
                      contact: {
                        ...footer.contact,
                        address: val,
                      },
                    })
                  }
                />
              </Field>

              <Field label="Phone Number">
                <Input
                  value={footer.contact.phone}
                  onChange={(val) =>
                    setFooter({
                      ...footer,
                      contact: {
                        ...footer.contact,
                        phone: val,
                      },
                    })
                  }
                />
              </Field>

              <Field label="Email Address">
                <Input
                  value={footer.contact.email}
                  onChange={(val) =>
                    setFooter({
                      ...footer,
                      contact: {
                        ...footer.contact,
                        email: val,
                      },
                    })
                  }
                />
              </Field>
            </Grid>
          </Section>

          {/* ================= BOTTOM ================= */}
          {/* <Section title="Bottom Section">
            <Field label="Copyright">
              <Input
                value={footer.bottom.copyright}
                onChange={(val) =>
                  setFooter({
                    ...footer,
                    bottom: {
                      ...footer.bottom,
                      copyright: val,
                    },
                  })
                }
              />
            </Field>

            <InputWithButton
              value={bottomInput.label}
              setValue={(v) => setBottomInput((p) => ({ ...p, label: v }))}
              secondValue={bottomInput.link}
              setSecondValue={(v) => setBottomInput((p) => ({ ...p, link: v }))}
              placeholder="Label"
              secondPlaceholder="Link"
              onAdd={() => {
                if (!bottomInput.label || !bottomInput.link) return;

                if (!isValidURL(bottomInput.link)) {
                  setAlertConfig({
                    open: true,
                    type: "error",
                    title: "Invalid URL",
                    message: "Please enter a valid URL",
                  });
                  return;
                }

                setFooter((prev) => ({
                  ...prev,
                  bottom: {
                    ...prev.bottom,
                    links: [...prev.bottom.links, bottomInput],
                  },
                }));

                setBottomInput({ label: "", link: "" });
              }}
            />

            <EditableChips
              items={footer.bottom.links}
              getLabel={(i) => i.label}
              getExtra={(i) => i.link}
              onDelete={(i) =>
                setFooter((prev) => ({
                  ...prev,
                  bottom: {
                    ...prev.bottom,
                    links: prev.bottom.links.filter((_, idx) => idx !== i),
                  },
                }))
              }
              onUpdate={(i, label, link) =>
                setFooter((prev) => {
                  const updated = [...prev.bottom.links];
                  updated[i] = {
                    ...updated[i],
                    label,
                    link,
                  };

                  return {
                    ...prev,
                    bottom: { ...prev.bottom, links: updated },
                  };
                })
              }
            />
          </Section> */}

          {/* SAVE */}
          <div className="flex justify-end pt-4 border-t border-gray-300">
            <button
              disabled={!isDirty || loading}
              onClick={() => onSave?.(footer)}
              className={`px-6 py-2.5 rounded-full text-white font-medium shadow-md transition
    ${!isDirty || loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-orange-500 hover:scale-105"
                }
  `}
            >
              {loading ? "Saving..." : isDirty ? "Update Footer" : "Saved"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ================= REUSABLE ================= */

const Section = ({ title, children }) => (
  <div className="border border-gray-300 rounded-xl p-5 bg-gray-50 space-y-4">
    <h2 className="text-sm font-semibold text-gray-700 uppercase">{title}</h2>
    {children}
  </div>
);

const Field = ({ label, children }) => (
  <div>
    <label className="text-sm text-gray-600 mb-1 block">{label}</label>
    {children}
  </div>
);

const Grid = ({ children }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
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
  secondValue,
  setSecondValue,
  placeholder,
  secondPlaceholder,
  onAdd,
}) => (
  <div className="flex flex-col sm:flex-row gap-2">
    <Input value={value} onChange={setValue} placeholder={placeholder} />
    {secondValue !== undefined && (
      <Input
        value={secondValue}
        onChange={setSecondValue}
        placeholder={secondPlaceholder}
      />
    )}
    <button
      onClick={onAdd}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
    >
      Add
    </button>
  </div>
);

const EditableChips = ({
  items,
  getLabel,
  getExtra,
  onDelete,
  onUpdate,
}) => (
  <div className="flex flex-wrap gap-2 mt-2">
    {items.map((item, i) => (
      <EditableChip
        key={i}
        value={getLabel(item)}
        extra={getExtra ? getExtra(item) : undefined}
        onDelete={() => onDelete(i)}
        onUpdate={(label, link) => onUpdate(i, label, link)}
      />
    ))}
  </div>
);