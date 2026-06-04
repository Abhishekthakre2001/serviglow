import pool from "../../../config/db.js";

export const upsertAnnouncementService = async (announcement) => {

  const [rows] = await pool.query(
    `SELECT id FROM announcement_bar LIMIT 1`
  );

  if (rows.length > 0) {

    await pool.query(
      `UPDATE announcement_bar
       SET announcement = ?
       WHERE id = ?`,
      [announcement, rows[0].id]
    );

    return {
      message: "Announcement updated successfully",
    };

  } else {

    await pool.query(
      `INSERT INTO announcement_bar (announcement)
       VALUES (?)`,
      [announcement]
    );

    return {
      message: "Announcement created successfully",
    };
  }
};

export const getAnnouncementService = async () => {

  const [rows] = await pool.query(
    `SELECT 
        id,
        announcement,
        created_at,
        updated_at
     FROM announcement_bar
     LIMIT 1`
  );

  return rows[0] || null;
};