"use client";

import { useState, useCallback } from "react";
import { useFetchData } from "@/hooks/useFetchData";
import categoryApi from "@/services/category";
import subcategoryApi from "@/services/subcategory";

/* ================= FORMAT ================= */
const formatForDropdown = (items, nameField) => {
    const list = Array.isArray(items) ? items : [];

    return list.map((item) => ({
        label: item[nameField] || "",
        value: item.id,
    }));
};

export const useMasterData = () => {
    const [selectedCategoryId, setSelectedCategoryId] = useState("");

    console.log("selectedCategoryId:", selectedCategoryId);

    /* ================= CATEGORIES ================= */
    const { data: rawCategories, loading: categoriesLoading } =
        useFetchData(() => categoryApi.getCategories());

    /* ================= SUBCATEGORIES ================= */
    const { data: rawSubcategories, loading: subcategoriesLoading } =
        useFetchData(
            () =>
                selectedCategoryId
                    ? subcategoryApi.getSubcategories({
                          categoryId: selectedCategoryId, // ✅ FIX
                      })
                    : Promise.resolve({ data: [] }),
            [selectedCategoryId] // ✅ THIS triggers API
        );

    /* ================= DATA EXTRACTION ================= */

    // your hook already returns res.data
    const categoriesSource = rawCategories?.data || [];
    const subcategoriesSource = rawSubcategories?.data || [];

    /* ================= FORMAT ================= */
    const categories = formatForDropdown(
        categoriesSource,
        "category_name"
    );

    const subcategories = formatForDropdown(
        subcategoriesSource,
        "sub_category_name"
    );

    /* ================= HANDLER ================= */
    const handleSelectCategory = useCallback((categoryId) => {
        setSelectedCategoryId(categoryId);
    }, []);

    return {
        categories,
        categoriesLoading,
        subcategories,
        subcategoriesLoading,
        selectedCategoryId,
        handleSelectCategory,
    };
};