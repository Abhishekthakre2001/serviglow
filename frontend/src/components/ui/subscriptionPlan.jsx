"use client";

import React, {
    useEffect,
    useState,
} from "react";

import paymentApi from "@/services/paymentApi";

import {
    Plus,
    Trash2,
    Save,
} from "lucide-react";

export default function SubscriptionPlan() {

    const [plans, setPlans] = useState([]);

    const [loading, setLoading] =
        useState(false);

    const [savingKey, setSavingKey] =
        useState(null);

    // =========================
    // FETCH PLANS
    // =========================

    const fetchPlans = async () => {

        try {

            setLoading(true);

            const res =
                await paymentApi.getPlanDetails();

            if (res?.data?.success) {

                const formatted =
                    res.data.data.map((plan) => ({
                        id: plan.id,

                        planKey: plan.plan_key,

                        planName:
                            plan.plan_name || "",

                        amount:
                            Number(plan.amount) || 0,

                        features:
                            Array.isArray(plan.features)
                                ? plan.features
                                : [],
                    }));

                setPlans(formatted);
            }

        } catch (err) {

            console.log(
                "FETCH PLAN ERROR =>",
                err
            );

            alert(
                err?.response?.data?.message ||
                "Failed to load plans"
            );

        } finally {

            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    // =========================
    // CHANGE PLAN FIELD
    // =========================

    const handleChange = (
        index,
        field,
        value
    ) => {

        const updated = [...plans];

        updated[index][field] = value;

        setPlans(updated);
    };

    // =========================
    // CHANGE FEATURE
    // =========================

    const handleFeatureChange = (
        planIndex,
        featureIndex,
        value
    ) => {

        const updated = [...plans];

        updated[planIndex].features[
            featureIndex
        ] = value;

        setPlans(updated);
    };

    // =========================
    // ADD FEATURE
    // =========================

    const addFeature = (planIndex) => {

        const updated = [...plans];

        updated[planIndex].features.push("");

        setPlans(updated);
    };

    // =========================
    // REMOVE FEATURE
    // =========================

    const removeFeature = (
        planIndex,
        featureIndex
    ) => {

        const updated = [...plans];

        updated[planIndex].features.splice(
            featureIndex,
            1
        );

        setPlans(updated);
    };

    // =========================
    // UPDATE PLAN
    // =========================

    const handleUpdatePlan = async (
        plan
    ) => {

        try {

            // =====================
            // VALIDATION
            // =====================

            if (!plan.planName.trim()) {
                return alert(
                    "Plan name required"
                );
            }

            if (
                !plan.amount ||
                Number(plan.amount) <= 0
            ) {
                return alert(
                    "Pricing must be positive"
                );
            }

            const validFeatures =
                plan.features.filter(
                    (f) => f.trim() !== ""
                );

            if (!validFeatures.length) {
                return alert(
                    "At least one feature required"
                );
            }

            setSavingKey(plan.planKey);

            // =====================
            // API BODY
            // =====================

            const payload = {
                planName: plan.planName,

                amount: Number(plan.amount),

                features: validFeatures,
            };

            console.log(
                "UPDATE PAYLOAD =>",
                payload
            );

            // =====================
            // API CALL
            // =====================

            const res =
                await paymentApi.updatePlanDetails(
                    plan.planKey,
                    payload
                );

            alert(
                res?.data?.message ||
                "Plan updated successfully"
            );

            fetchPlans();

        } catch (err) {

            console.log(
                "UPDATE ERROR =>",
                err
            );

            alert(
                err?.response?.data?.message ||
                "Plan update failed"
            );

        } finally {

            setSavingKey(null);
        }
    };

    // =========================
    // UI
    // =========================

    if (loading) {

        return (
            <div className="text-center py-10">
                Loading plans...
            </div>
        );
    }

    return (
        <div className="space-y-8">

            {plans.map((plan, index) => (

                <div
                    key={plan.planKey}
                    className="bg-white border rounded-2xl shadow-sm p-6"
                >

                    {/* HEADER */}
                    <div className="flex items-center justify-between mb-6">

                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">
                                {plan.planKey}
                            </h2>

                            <p className="text-sm text-gray-500">
                                Update subscription details
                            </p>
                        </div>

                    </div>

                    {/* PLAN NAME */}
                    <div className="mb-5">

                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Plan Name
                        </label>

                        <input
                            type="text"
                            value={plan.planName}
                            onChange={(e) =>
                                handleChange(
                                    index,
                                    "planName",
                                    e.target.value
                                )
                            }
                            className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter plan name"
                        />

                    </div>

                    {/* PRICING */}
                    <div className="mb-6">

                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Pricing (USD)
                        </label>

                        <input
                            type="number"
                            min="1"
                            step="0.01"
                            value={plan.amount}
                            onChange={(e) => {

                                const value =
                                    Number(e.target.value);

                                if (value >= 0) {

                                    handleChange(
                                        index,
                                        "amount",
                                        value
                                    );
                                }
                            }}
                            className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter amount"
                        />

                    </div>

                    {/* FEATURES */}
                    <div>

                        <div className="flex items-center justify-between mb-4">

                            <label className="text-sm font-medium text-gray-700">
                                Features
                            </label>

                            <button
                                onClick={() =>
                                    addFeature(index)
                                }
                                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                <Plus size={16} />
                                Add Feature
                            </button>

                        </div>

                        <div className="space-y-3">

                            {plan.features.map(
                                (feature, featureIndex) => (

                                    <div
                                        key={featureIndex}
                                        className="flex gap-3"
                                    >

                                        <input
                                            type="text"
                                            value={feature}
                                            onChange={(e) =>
                                                handleFeatureChange(
                                                    index,
                                                    featureIndex,
                                                    e.target.value
                                                )
                                            }
                                            className="flex-1 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder={`Feature ${featureIndex + 1}`}
                                        />

                                        <button
                                            onClick={() =>
                                                removeFeature(
                                                    index,
                                                    featureIndex
                                                )
                                            }
                                            className="px-4 bg-red-100 text-red-600 rounded-xl hover:bg-red-200"
                                        >
                                            <Trash2 size={18} />
                                        </button>

                                    </div>
                                )
                            )}

                        </div>

                    </div>

                    {/* SAVE BUTTON */}
                    <div className="mt-8">

                        <button
                            onClick={() =>
                                handleUpdatePlan(plan)
                            }
                            disabled={
                                savingKey ===
                                plan.planKey
                            }
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium transition
              
              ${savingKey ===
                                    plan.planKey
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-green-600 hover:bg-green-700"
                                }`}
                        >

                            <Save size={18} />

                            {savingKey ===
                                plan.planKey
                                ? "Saving..."
                                : "Update Plan"}

                        </button>

                    </div>

                </div>
            ))}
        </div>
    );
}