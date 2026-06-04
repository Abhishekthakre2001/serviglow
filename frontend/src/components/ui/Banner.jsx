"use client";

import React, { useState, useEffect } from "react";
import cmsApi from "../../services/cms";
import Alert from "@/components/ui/Conformation";

/* ================= MAIN ================= */
export default function BannerContent({
  initialData = {},
}) {

  const [data, setData] = useState({
    counters: [],
    real_count: 0,
    ...initialData,
  });

  const [alertConfig, setAlertConfig] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
    onConfirm: null,
  });

  const [counterInput, setCounterInput] = useState({
    number: "",
    title: "",
  });

  const [loading, setLoading] = useState(false);
  const [initialState, setInitialState] = useState("");

  /* ================= SET INITIAL ================= */
  useEffect(() => {

    const formatted = {
      counters: initialData?.counters || [],
      real_count: initialData?.real_count || 0,
    };

    setData(formatted);

    setInitialState(JSON.stringify(formatted));

  }, [initialData]);

  /* ================= DIRTY CHECK ================= */
  const isDirty =
    JSON.stringify(data) !== initialState;

  /* ================= ADD COUNTER ================= */
  const addCounter = () => {

    if (data.real_count) return;

    if (
      !counterInput.number.trim() ||
      !counterInput.title.trim()
    ) return;

    setData((prev) => ({
      ...prev,
      counters: [
        ...prev.counters,
        {
          number: counterInput.number,
          title: counterInput.title,
        },
      ],
    }));

    setCounterInput({
      number: "",
      title: "",
    });
  };

  /* ================= DELETE ================= */
  const removeCounter = (index) => {

    if (data.real_count) return;

    setData((prev) => ({
      ...prev,
      counters: prev.counters.filter(
        (_, i) => i !== index
      ),
    }));
  };

  /* ================= UPDATE ================= */
  const updateCounter = (
    index,
    field,
    value
  ) => {

    if (data.real_count) return;

    setData((prev) => {

      const updated = [...prev.counters];

      updated[index] = {
        ...updated[index],
        [field]: value,
      };

      return {
        ...prev,
        counters: updated,
      };
    });
  };

  /* ================= TOGGLE ================= */
  const toggleRealCounter = () => {
    setData((prev) => ({
      ...prev,
      real_count: prev.real_count ? 0 : 1,
    }));
  };

  /* ================= SAVE API ================= */
  const handleSave = async () => {

    try {

      setLoading(true);

      const payload = {
        real_count: data.real_count,
        counters: data.counters.map((item) => ({
          number: String(item.number),
          title: String(item.title),
        })),
      };

      console.log("FINAL PAYLOAD", payload);

      const response =
        await cmsApi.upsertbanner(payload);

      console.log(
        "API RESPONSE",
        response.data
      );

      setInitialState(JSON.stringify(data));

      setAlertConfig({
        open: true,
        type: "success",
        title: "Success",
        message:
          "Banner updated successfully",
      });

    } catch (error) {

      console.log("SAVE ERROR", error);

      setAlertConfig({
        open: true,
        type: "error",
        title: "Error",
        message:
          error?.response?.data?.message ||
          "Failed to update banner",
      });

    } finally {

      setLoading(false);
    }
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

        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            Banner Management
          </h1>
        </div>

        <div className="bg-white shadow-lg rounded-2xl p-6 space-y-6">

          {/* ================= COUNTERS ================= */}
          <Section title="Counters">

            {/* ================= TOP BAR ================= */}
            <div className="flex items-center justify-between flex-wrap gap-4">

              <div className="flex items-center gap-3">

                <span className="text-sm font-medium text-gray-700">
                  Use Real Counters
                </span>

                {/* TOGGLE */}
                <button
                  type="button"
                  onClick={toggleRealCounter}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition
                  ${data.real_count
                      ? "bg-green-500"
                      : "bg-gray-300"
                    }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition
                    ${data.real_count
                        ? "translate-x-6"
                        : "translate-x-1"
                      }`}
                  />
                </button>

              </div>

              {data.real_count ? (
                <span className="text-sm text-green-600 font-medium">
                  Real database counters enabled
                </span>
              ) : (
                <span className="text-sm text-gray-500">
                  Manual counters enabled
                </span>
              )}

            </div>

            {/* ================= INPUT ROW ================= */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">

              <Input
                disabled={data.real_count}
                value={counterInput.number}
                onChange={(val) =>
                  setCounterInput((prev) => ({
                    ...prev,
                    number: val,
                  }))
                }
                placeholder="Number (e.g. 10K+, 24/7)"
              />

              <Input
                disabled={data.real_count}
                value={counterInput.title}
                onChange={(val) =>
                  setCounterInput((prev) => ({
                    ...prev,
                    title: val,
                  }))
                }
                placeholder="Title"
              />

              <button
                onClick={addCounter}
                disabled={data.real_count}
                className={`rounded-lg text-sm px-4 py-2 text-white transition
                ${data.real_count
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                  }`}
              >
                Add Counter
              </button>

            </div>

            {/* ================= LIST ================= */}
            <div className="mt-4 space-y-2">

              {data.counters?.map((item, i) => (

                <div
                  key={i}
                  className="flex gap-2 items-center bg-gray-50 p-3 rounded-lg"
                >

                  <Input
                    disabled={data.real_count}
                    value={item.number}
                    onChange={(val) =>
                      updateCounter(
                        i,
                        "number",
                        val
                      )
                    }
                  />

                  <Input
                    disabled={data.real_count}
                    value={item.title}
                    onChange={(val) =>
                      updateCounter(
                        i,
                        "title",
                        val
                      )
                    }
                  />

                  <button
                    disabled={data.real_count}
                    onClick={() =>
                      removeCounter(i)
                    }
                    className={`text-sm
                    ${data.real_count
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-red-500 hover:text-red-700"
                      }`}
                  >
                    ✕
                  </button>

                </div>
              ))}

            </div>

          </Section>

          {/* ================= SAVE ================= */}
          <div className="flex justify-end pt-4 border-t border-gray-300">

            <button
              disabled={!isDirty || loading}
              onClick={handleSave}
              className={`px-6 py-2.5 rounded-full text-white font-medium transition
              ${!isDirty || loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-orange-500 hover:scale-105"
                }`}
            >
              {loading
                ? "Saving..."
                : isDirty
                  ? "Update Banner"
                  : "Saved"}
            </button>

          </div>

        </div>

      </div>
    </>
  );
}

/* ================= REUSABLE ================= */

const Section = ({
  title,
  children,
}) => (
  <div className="border border-gray-300 rounded-xl p-5 bg-gray-50 space-y-4">
    <h2 className="text-sm font-semibold text-gray-700 uppercase">
      {title}
    </h2>
    {children}
  </div>
);

const Input = ({
  value,
  onChange,
  placeholder,
  disabled = false,
}) => (
  <input
    type="text"
    value={value || ""}
    disabled={disabled}
    onChange={(e) =>
      onChange(e.target.value)
    }
    placeholder={placeholder}
    className={`w-full border rounded-lg px-3 py-2 text-sm outline-none
    ${disabled
        ? "bg-gray-100 cursor-not-allowed border-gray-200"
        : "border-gray-300 focus:ring-2 focus:ring-blue-500"
      }`}
  />
);