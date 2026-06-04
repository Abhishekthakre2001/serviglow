import fs from "fs";
import path from "path";

export const deleteFile = (filePath) => {
  if (!filePath) return;

  try {
    const fullPath = path.join(
      process.cwd(),
      filePath.replace(/^\//, "")
    );

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (error) {
    console.error("Error deleting file:", error.message);
  }
};