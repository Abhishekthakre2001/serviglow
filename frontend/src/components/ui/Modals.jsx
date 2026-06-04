"use client";

import { X } from "lucide-react";

const Modal = ({ open, onClose, title, children, width = "max-w-lg", footer }) => {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
           <div className={`bg-white rounded-xl shadow-xl w-full ${width} relative animate-fadeIn max-h-[90vh] flex flex-col overflow-visible`}>


                {/* Header - Sticky */}
                <div className="flex-shrink-0 p-4 sm:p-6 ">
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 p-1 text-gray-600 hover:text-black transition z-10"
                    >
                        <X size={20} className="sm:w-[22px] sm:h-[22px]" />
                    </button>

                    {/* Title */}
                    {title && (
                        <h2 className="text-lg sm:text-xl font-semibold text-slate-800 pr-8">{title}</h2>
                    )}
                </div>

                {/* Content - Scrollable */}
               <div className="flex-1 overflow-y-auto overflow-x-visible p-4 sm:p-6">

                    {children}
                </div>

                {/* Footer - Sticky (if provided) */}
                {footer && (
                    <div className="flex-shrink-0 p-4 sm:p-6 bg-gray-50">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;