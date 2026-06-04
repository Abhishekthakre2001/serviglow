import { asyncHandler } from "../../../utils/asyncHandler.js";
import { CategoryModel } from "../models/category.model.js";

import fs from "fs";
import path from "path";

const deleteImageFile = (imagePath) => {
  if (!imagePath) return;

  const fullPath = path.join(process.cwd(), imagePath.replace(/^\//, ""));

  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
};

// ══════════════════════════════════════════════
// CREATE CATEGORY
// ══════════════════════════════════════════════
export const createCategory = asyncHandler(async (req, res) => {
  const { categoryName, subTitle } = req.body;

  if (!categoryName) {
    return res.status(400).json({ success: false, message: "Category name is required" });
  }

  if (!req.file) {
    return res.status(400).json({ success: false, message: "Category image is required" });
  }

  const existing = await CategoryModel.findByName(categoryName.trim());
  if (existing) {
    return res.status(409).json({ success: false, message: "Category already exists" });
  }

  const category = await CategoryModel.create({
    categoryName: categoryName.trim(),
    subTitle: subTitle?.trim() || "",
    image: `/uploads/${req.file.filename}`,
  });

  res.status(201).json({ success: true, data: category });
});

// ══════════════════════════════════════════════
// GET CATEGORIES (paginated, active only)
// ══════════════════════════════════════════════
export const getCategories = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page || 1, 10), 1);
  const limit = Math.min(parseInt(req.query.limit || 5, 10), 100);
  const skip = (page - 1) * limit;

  const total = await CategoryModel.countActive();
  const categories = await CategoryModel.findAllActive({ limit, skip });

  res.status(200).json({
    success: true,
    data: categories,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// ══════════════════════════════════════════════
// UPDATE CATEGORY
// ══════════════════════════════════════════════
export const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { categoryName, subTitle, status } = req.body;

  const category = await CategoryModel.findById(id);

  if (!category) {
    return res.status(404).json({
      success: false,
      message: "Category not found",
    });
  }

  const updates = {};

  if (categoryName !== undefined)
    updates.category_name = categoryName.trim();

  if (subTitle !== undefined)
    updates.sub_title = subTitle.trim();

  if (status !== undefined)
    updates.status = status;

  // New image uploaded
  if (req.file) {
    // delete old image first
    deleteImageFile(category.image);

    updates.image = `/uploads/${req.file.filename}`;
  }

  const updated = await CategoryModel.update(id, updates);

  res.status(200).json({
    success: true,
    data: updated,
  });
});

// ══════════════════════════════════════════════
// DELETE CATEGORY (soft delete → status = 0)
// ══════════════════════════════════════════════
export const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await CategoryModel.findById(id);
  if (!category) {
    return res.status(404).json({ success: false, message: "Category not found" });
  }
   // delete physical file
  await deleteImageFile(category.image);


  await CategoryModel.update(id, { status: 0 });

  res.status(200).json({ success: true, message: "Category deleted successfully" });
});