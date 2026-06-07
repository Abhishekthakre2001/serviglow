"use client";

import { UploadCloud, X, FileText, AlertCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function FileUpload({
  label,
  name,
  onChange,
  files = [],
  required = false,
  multiple = false,
  maxFiles = 1,
  maxSizeMB = 5,
}) {
  const inputRef = useRef();
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);

  const MAX_SIZE = maxSizeMB * 1024 * 1024;

  // ✅ required validation (after touch)
  useEffect(() => {
    if (!touched) return;

    if (required && (!files || files.length === 0)) {
      setError(`${label || name} is required`);
      return;
    }

    // don’t clear size error here; clear only required error
    if (error === `${label || name} is required`) {
      setError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, touched, required, label, name]);

  const handleFiles = (selectedFiles) => {
    setTouched(true);

    let fileArray = Array.from(selectedFiles || []);

    // If user cancels file picker
    if (!fileArray.length) {
      if (required && (!files || files.length === 0)) {
        setError(`${label || name} is required`);
      }
      return;
    }

    // Limit file count
    if (maxFiles) fileArray = fileArray.slice(0, maxFiles);

    // Size validation
    const oversizedFile = fileArray.find((file) => file.size > MAX_SIZE);

    if (oversizedFile) {
      setError(`File "${oversizedFile.name}" exceeds ${maxSizeMB}MB limit.`);
      return;
    }

    setError("");

    onChange?.({
      target: {
        name,
        files: fileArray,
      },
    });
  };

  const removeFile = (index) => {
    setTouched(true);

    const updated = [...(files || [])];
    updated.splice(index, 1);

    onChange?.({
      target: {
        name,
        files: updated,
      },
    });

    // show required error immediately if it becomes empty
    if (required && updated.length === 0) {
      setError(`${label || name} is required`);
    }
  };

  const isImage = (file) => file?.type?.startsWith("image/");

  const showError = touched && !!error;

  return (
    <div className="space-y-3 w-full">
      {/* LABEL */}
      {label && (
        <label className="text-sm font-medium block">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* 2 COLUMN LAYOUT */}
      <div className="grid md:grid-cols-2 gap-6 items-start">
        {/* LEFT SIDE - UPLOAD AREA */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            setTouched(true);
            inputRef.current?.click();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              setTouched(true);
              inputRef.current?.click();
            }
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            setTouched(true);
            handleFiles(e.dataTransfer.files);
          }}
          className={`
            border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition
            h-40 flex flex-col justify-center
            ${showError
              ? "border-red-500 bg-red-50"
              : "border-gray-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50"
            }
          `}
        >
          <UploadCloud className="mx-auto mb-2 text-blue-500" />
          <p className="text-sm text-gray-600">
            Drag & Drop files or{" "}
            <span className="text-blue-600 font-medium">Browse</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Max file size: {maxSizeMB}MB (max {maxFiles} files)
          </p>
        </div>

        {/* RIGHT SIDE - PREVIEW */}
        <div className="space-y-3">
          {(!files || files.length === 0) && !showError && (
            <div className="h-40 flex items-center justify-center text-gray-400 text-sm border rounded-xl bg-gray-50">
              No file selected
            </div>
          )}

          {(files || []).map((file, i) => (
            <div
              key={i}
              className="relative bg-white border rounded-xl overflow-hidden shadow-sm h-40"
            >
              {isImage(file) ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-4">
                  <FileText className="text-blue-500 mb-2" size={36} />
                  <p className="text-xs text-center truncate w-full">
                    {file.name}
                  </p>
                </div>
              )}

              {/* <button
                type="button"
                onClick={() => removeFile(i)}
                className="absolute top-2 right-2 bg-white rounded-full p-1 shadow
                  text-red-500 hover:text-red-700 transition"
              >
                <X size={14} />
              </button> */}
            </div>
          ))}
        </div>
      </div>

      {/* ERROR MESSAGE */}
      {showError && (
        <div className="flex items-center gap-2 text-red-500 text-sm">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* HIDDEN INPUT */}
      <input
        ref={inputRef}
        type="file"
        hidden
        multiple={multiple}
        accept=".pdf,application/pdf"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}