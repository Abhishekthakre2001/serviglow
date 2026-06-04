import React, { useEffect, useState } from "react";
import cmsApi from "@/services/cms";
import {
    ChevronDown,
    ChevronUp,
    Plus,
    Trash2,
    Loader2,
} from "lucide-react";

import Alert from "@/components/ui/Conformation";

export default function DynamicPricing() {
    const plans = ["BASIC", "MODERN", "PREMIUM"];

    const [openPlan, setOpenPlan] = useState(null);
    const [loading, setLoading] = useState(false);

    const [pricingData, setPricingData] = useState({});

    // Alert State
    const [alertState, setAlertState] = useState({
        open: false,
        type: "success",
        title: "",
        message: "",
    });

    // Fetch Plans
    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            setLoading(true);

            const response = await cmsApi.getPlanDetails();

            const apiPlans = response.data.data;

            const formattedData = {};

            apiPlans.forEach((plan) => {
                formattedData[plan.plan_key] = {
                    planName: plan.plan_name,
                    amount: plan.amount,
                    features: plan.features || [],
                    status: plan.status,
                    currency: plan.currency,
                };
            });

            setPricingData(formattedData);
        } catch (error) {
            console.error(error);

            setAlertState({
                open: true,
                type: "error",
                title: "Error",
                message: "Failed to load plans",
            });
        } finally {
            setLoading(false);
        }
    };

    // Handle Input
    const handleChange = (plan, field, value) => {
        setPricingData((prev) => ({
            ...prev,
            [plan]: {
                ...prev[plan],
                [field]: field === "amount" ? Number(value) : value,
            },
        }));
    };

    // Feature Update
    const handleFeatureChange = (plan, index, value) => {
        const updatedFeatures = [...pricingData[plan].features];

        updatedFeatures[index] = value;

        setPricingData((prev) => ({
            ...prev,
            [plan]: {
                ...prev[plan],
                features: updatedFeatures,
            },
        }));
    };

    // Add Feature
    const addFeature = (plan) => {
        setPricingData((prev) => ({
            ...prev,
            [plan]: {
                ...prev[plan],
                features: [...prev[plan].features, ""],
            },
        }));
    };

    // Remove Feature
    const removeFeature = (plan, index) => {
        const updatedFeatures = pricingData[plan].features.filter(
            (_, i) => i !== index
        );

        setPricingData((prev) => ({
            ...prev,
            [plan]: {
                ...prev[plan],
                features: updatedFeatures,
            },
        }));
    };

    // Update Plan
    const handleSubmit = async (plan) => {
        try {
            const amount = Number(pricingData[plan].amount);

            if (!amount || amount < 1) {
                setAlertState({
                    open: true,
                    type: "error",
                    title: "Invalid Amount",
                    message: "Plan amount must be at least $1",
                });
                return;
            }


            setLoading(true);

            const payload = {
                planName: pricingData[plan].planName,
                amount: Number(pricingData[plan].amount),
                features: pricingData[plan].features,
            };

            await cmsApi.updatePlan(plan, payload);

            setAlertState({
                open: true,
                type: "success",
                title: "Success",
                message: `${plan} plan updated successfully`,
            });

            fetchPlans();
        } catch (error) {
            console.error(error);

            setAlertState({
                open: true,
                type: "error",
                title: "Update Failed",
                message: "Something went wrong while updating",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 py-10 px-4">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">
                        Pricing Plan Management
                    </h1>

                    <p className="text-gray-500 mt-2">
                        Manage BASIC, MODERN and PREMIUM plans
                    </p>
                </div>

                {/* Loading */}
                {loading && Object.keys(pricingData).length === 0 ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="animate-spin" size={40} />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {plans.map((plan) => {
                            const currentPlan = pricingData[plan];

                            if (!currentPlan) return null;

                            return (
                                <div
                                    key={plan}
                                    className="bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden"
                                >
                                    {/* Accordion Header */}
                                    <button
                                        onClick={() =>
                                            setOpenPlan(
                                                openPlan === plan ? null : plan
                                            )
                                        }
                                        className={`w-full p-6 flex items-center justify-between transition-all
                      ${plan === "BASIC"
                                                ? "bg-white"
                                                : plan === "MODERN"
                                                    ? "bg-white"
                                                    : "bg-white"
                                            }
                      text-gray-600`}
                                    >
                                        <div className="text-left">
                                            <h2 className="text-2xl font-bold">
                                                {plan}
                                            </h2>

                                            <div className="flex items-center gap-3 mt-2">
                                                <span className="text-lg font-semibold">
                                                    ${currentPlan.amount}
                                                </span>

                                                <span className="bg-white/20 text-sm px-3 py-1 rounded-full">
                                                    {currentPlan.status}
                                                </span>
                                            </div>
                                        </div>

                                        {openPlan === plan ? (
                                            <ChevronUp size={28} />
                                        ) : (
                                            <ChevronDown size={28} />
                                        )}
                                    </button>

                                    {/* Accordion Content */}
                                    {openPlan === plan && (
                                        <div className="p-6 bg-gray-50">
                                            {/* Plan Name */}
                                            <div className="mb-6">
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Plan Name
                                                </label>

                                                <input
                                                    type="text"
                                                    value={currentPlan.planName}
                                                    onChange={(e) =>
                                                        handleChange(
                                                            plan,
                                                            "planName",
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-full border border-gray-300 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                />
                                            </div>

                                            {/* Price */}
                                            <div className="mb-6">
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Monthly Price
                                                </label>

                                                <input
                                                    type="number"
                                                    min={1}
                                                    value={currentPlan.amount}
                                                    onChange={(e) => {
                                                        const value = Number(e.target.value);

                                                        handleChange(
                                                            plan,
                                                            "amount",
                                                            value < 1 ? 1 : value
                                                        );
                                                    }}
                                                    className="w-full border border-gray-300 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                />
                                            </div>

                                            {/* Features */}
                                            <div className="mb-6">
                                                <div className="flex justify-between items-center mb-4">
                                                    <h3 className="text-lg font-semibold text-gray-800">
                                                        Features
                                                    </h3>

                                                    <button
                                                        type="button"
                                                        onClick={() => addFeature(plan)}
                                                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition"
                                                    >
                                                        <Plus size={18} />
                                                        Add Feature
                                                    </button>
                                                </div>

                                                <div className="space-y-3">
                                                    {currentPlan.features.map(
                                                        (feature, index) => (
                                                            <div
                                                                key={index}
                                                                className="flex items-center gap-3"
                                                            >
                                                                <input
                                                                    type="text"
                                                                    value={feature}
                                                                    onChange={(e) =>
                                                                        handleFeatureChange(
                                                                            plan,
                                                                            index,
                                                                            e.target.value
                                                                        )
                                                                    }
                                                                    className="flex-1 border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                                    placeholder={`Feature ${index + 1
                                                                        }`}
                                                                />

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        removeFeature(plan, index)
                                                                    }
                                                                    className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-xl transition"
                                                                >
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            </div>

                                            {/* Submit */}
                                            <button
                                                onClick={() => handleSubmit(plan)}
                                                disabled={loading}
                                                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 rounded-2xl transition flex items-center justify-center gap-2"
                                            >
                                                {loading ? (
                                                    <>
                                                        <Loader2
                                                            className="animate-spin"
                                                            size={20}
                                                        />
                                                        Updating...
                                                    </>
                                                ) : (
                                                    `Update ${plan} Plan`
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Custom Alert */}
            <Alert
                open={alertState.open}
                type={alertState.type}
                title={alertState.title}
                message={alertState.message}
                onClose={() =>
                    setAlertState((prev) => ({
                        ...prev,
                        open: false,
                    }))
                }
            />
        </div>
    );
}