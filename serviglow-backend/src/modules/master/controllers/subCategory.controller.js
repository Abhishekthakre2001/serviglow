import { asyncHandler } from "../../../utils/asyncHandler.js";
import { SubCategoryModel } from "../models/subCategory.model.js";
import { CategoryModel } from "../models/category.model.js";
import { deleteFile } from "../../../utils/file.utils.js";

// ══════════════════════════════════════════════
// CREATE SUB-CATEGORY
// ══════════════════════════════════════════════
export const createSubCategory = asyncHandler(async (req, res) => {

  const { subCategoryName, categoryId, subTitle } = req.body;

  // Safe filename access
  const filename = req.file?.filename;

  // Validate image
  if (!filename) {
    return res.status(400).json({
      success: false,
      message: "SubCategory image is required",
    });
  }

  if (!subCategoryName || !categoryId) {
    return res.status(400).json({
      success: false,
      message: "SubCategory name and Category are required",
    });
  }

  // ── Validate category exists ──
  const category = await CategoryModel.findById(categoryId);
  if (!category) {
    return res.status(404).json({ success: false, message: "Category not found" });
  }

  // ── Check duplicate ──
  const exists = await SubCategoryModel.findByNameAndCategory(
    subCategoryName.trim(), categoryId
  );
  if (exists) {
    return res.status(409).json({
      success: false,
      message: "SubCategory already exists in this category",
    });
  }

  const subCategory = await SubCategoryModel.create({
    subCategoryName: subCategoryName.trim(),
    subTitle: subTitle?.trim() || "",
    categoryId,
    image: req.file ? `/uploads/${req.file.filename}` : "",
  });

  res.status(201).json({ success: true, data: subCategory });
});

// ══════════════════════════════════════════════
// GET SUB-CATEGORIES (paginated, with categoryId filter)
// ══════════════════════════════════════════════
export const getSubCategories = asyncHandler(async (req, res) => {
  const { categoryId } = req.query;
  const page = Math.max(parseInt(req.query.page || 1, 10), 1);
  const limit = Math.min(parseInt(req.query.limit || 100, 10), 100);
  const skip = (page - 1) * limit;

  const total = await SubCategoryModel.countActive(categoryId);
  const subCategories = await SubCategoryModel.findAllActive({ categoryId, limit, skip });

  res.status(200).json({
    success: true,
    data: subCategories,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// ══════════════════════════════════════════════
// UPDATE SUB-CATEGORY
// ══════════════════════════════════════════════
export const updateSubCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { subCategoryName, status, categoryId, subTitle } = req.body;

  const subCategory = await SubCategoryModel.findById(id);
  if (!subCategory) {
    return res.status(404).json({ success: false, message: "SubCategory not found" });
  }

  // ── Validate new categoryId if provided ──
  if (categoryId) {
    const category = await CategoryModel.findById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    // ── Check duplicate with new categoryId ──
    const duplicate = await SubCategoryModel.findDuplicate({
      subCategoryName: subCategoryName?.trim() ?? subCategory.sub_category_name,
      categoryId,
      excludeId: id,
    });
    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "SubCategory already exists in this category",
      });
    }
  }

  const updates = {};
  if (subCategoryName !== undefined) updates.sub_category_name = subCategoryName.trim();
  if (subTitle !== undefined) updates.sub_title = subTitle.trim();
  if (categoryId !== undefined) updates.category_id = categoryId;
  if (status !== undefined) updates.status = status;
  if (req.file) {
    deleteFile(subCategory.image);

    updates.image = `/uploads/${req.file.filename}`;
  }

  const updated = await SubCategoryModel.update(id, updates);

  res.status(200).json({ success: true, data: updated });
});

// ══════════════════════════════════════════════
// DELETE SUB-CATEGORY (soft delete → status = 0)
// ══════════════════════════════════════════════
export const deleteSubCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const subCategory = await SubCategoryModel.findById(id);
  if (!subCategory) {
    return res.status(404).json({ success: false, message: "SubCategory not found" });
  }

  await SubCategoryModel.update(id, { status: 0 });
  deleteFile(subCategory.image);

  res.status(200).json({ success: true, message: "SubCategory deleted successfully" });
});