import pool from "../../../config/db.js";

export const AdminModel = {

  // ── Footer ──────────────────────────────────
  async getFooter() {
    const [rows] = await pool.query("SELECT * FROM footer LIMIT 1");
    if (!rows.length) return null;

    const footer = rows[0];

    const [[highlights], [socials], [quickLinks], [bottomLinks]] = await Promise.all([
      pool.query("SELECT * FROM footer_highlights WHERE footer_id = ?", [footer.id]),
      pool.query("SELECT * FROM footer_socials WHERE footer_id = ?", [footer.id]),
      pool.query("SELECT * FROM footer_quick_links WHERE footer_id = ?", [footer.id]),
      pool.query("SELECT * FROM footer_bottom_links WHERE footer_id = ?", [footer.id]),
    ]);

    return {
      id: footer.id,
      highlights,
      company: {
        name: footer.company_name,
        description: footer.description,
        logo: footer.logo,
        socials,
      },
      quickLinks,
      contact: {
        companyName: footer.contact_name,
        address: footer.company_address,
        phone: footer.phone,
        email: footer.email,
      },
      bottom: {
        copyright: footer.copyright,
        links: bottomLinks,
      },
    };
  },

  async upsertFooter({ highlights, company, quickLinks, contact, bottom }) {
    const conn = await pool.getConnection();
    await conn.beginTransaction();
    try {
      const [existing] = await conn.query("SELECT id FROM footer LIMIT 1");

      let footerId;

      if (!existing.length) {
        const [result] = await conn.query(
          `INSERT INTO footer
            (company_name, description, logo, company_address, phone, email, contact_name, copyright)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            company?.name || "ServiGlow",
            company?.description || "",
            company?.logo || "",
            contact?.address || "",
            contact?.phone || "",
            contact?.email || "",
            contact?.companyName || "",
            bottom?.copyright || "",
          ]
        );
        footerId = result.insertId;
      } else {
        footerId = existing[0].id;
        await conn.query(
          `UPDATE footer SET
            company_name=?, description=?, logo=?,
            company_address=?, phone=?, email=?, contact_name=?, copyright=?
           WHERE id=?`,
          [
            company?.name, company?.description, company?.logo,
            contact?.address, contact?.phone, contact?.email,
            contact?.companyName, bottom?.copyright,
            footerId,
          ]
        );
      }

      // ── Replace child rows ──
      const replaceChildren = async (table, fkCol, rows, mapper) => {
        await conn.query(`DELETE FROM ${table} WHERE ${fkCol} = ?`, [footerId]);
        if (rows?.length) {
          for (const row of rows) {
            const [cols, vals] = mapper(row);
            await conn.query(
              `INSERT INTO ${table} (${fkCol}, ${cols}) VALUES (?, ${vals.map(() => "?").join(",")})`,
              [footerId, ...vals]
            );
          }
        }
      };

      await replaceChildren("footer_highlights", "footer_id", highlights,
        (h) => ["text, icon", [h.text, h.icon || ""]]);

      await replaceChildren("footer_socials", "footer_id", company?.socials,
        (s) => ["platform, icon, link", [s.platform || "facebook", s.icon || "", s.link || "#"]]);

      await replaceChildren("footer_quick_links", "footer_id", quickLinks,
        (l) => ["label, link", [l.label, l.link]]);

      await replaceChildren("footer_bottom_links", "footer_id", bottom?.links,
        (l) => ["label, link", [l.label, l.link]]);

      await conn.commit();
      conn.release();
      return this.getFooter();
    } catch (err) {
      await conn.rollback();
      conn.release();
      throw err;
    }
  },

  // ── Home Section ─────────────────────────────
  async getHomeSection() {
    const [rows] = await pool.query("SELECT * FROM home_section LIMIT 1");
    if (!rows.length) return null;

    const hs = rows[0];
    const [points] = await pool.query(
      "SELECT text, icon FROM why_choose_us_points WHERE home_section_id = ?",
      [hs.id]
    );

    return {
      id: hs.id,
      whyChooseUs: {
        heading: hs.why_choose_us_heading,
        points,
      },
      quickSupport: {
        heading: hs.quick_support_heading,
        description: hs.quick_support_desc,
        phoneNumber: hs.phone_number,
      },
    };
  },

  async upsertHomeSection({ whyChooseUs, quickSupport }) {
    const conn = await pool.getConnection();
    await conn.beginTransaction();
    try {
      const [existing] = await conn.query("SELECT id FROM home_section LIMIT 1");
      let hsId;

      if (!existing.length) {
        const [result] = await conn.query(
          `INSERT INTO home_section
            (why_choose_us_heading, quick_support_heading, quick_support_desc, phone_number)
           VALUES (?, ?, ?, ?)`,
          [
            whyChooseUs?.heading || "Why Choose Us?",
            quickSupport?.heading || "Quick Support",
            quickSupport?.description || "",
            quickSupport?.phoneNumber || "",
          ]
        );
        hsId = result.insertId;
      } else {
        hsId = existing[0].id;
        await conn.query(
          `UPDATE home_section SET
            why_choose_us_heading=?, quick_support_heading=?,
            quick_support_desc=?, phone_number=?
           WHERE id=?`,
          [
            whyChooseUs?.heading, quickSupport?.heading,
            quickSupport?.description, quickSupport?.phoneNumber,
            hsId,
          ]
        );
      }

      // Replace points
      await conn.query(
        "DELETE FROM why_choose_us_points WHERE home_section_id = ?", [hsId]
      );
      if (whyChooseUs?.points?.length) {
        for (const p of whyChooseUs.points) {
          await conn.query(
            "INSERT INTO why_choose_us_points (home_section_id, text, icon) VALUES (?, ?, ?)",
            [hsId, p.text, p.icon || "check"]
          );
        }
      }

      await conn.commit();
      conn.release();
      return this.getHomeSection();
    } catch (err) {
      await conn.rollback();
      conn.release();
      throw err;
    }
  },

  // ── Banner ───────────────────────────────────
  // async getBanner() {
  //   const [rows] = await pool.query("SELECT * FROM banner_counters");
  //   return rows.length ? { counters: rows } : null;
  // },
  async getBanner() {

    // CHECK FIRST ROW
    const [bannerRows] = await pool.query(`
    SELECT * FROM banner_counters
    LIMIT 1
  `);

    console.log(
      "DB VALUE:",
      bannerRows[0]?.real_count
    );

    const isRealCounter =
      bannerRows.length > 0
        ? Number(bannerRows[0].real_count) === 1
        : false;

    console.log(
      "IS REAL COUNTER:",
      isRealCounter
    );

    // =====================================================
    // IF REAL COUNTER ENABLED
    // =====================================================

    if (isRealCounter) {

      // Total customers
      const [customerRows] = await pool.query(`
      SELECT COUNT(*) AS totalCustomers
      FROM users
      WHERE role = 'customer'
    `);

      // Total approved partners
      const [partnerRows] = await pool.query(`
      SELECT COUNT(*) AS totalPartners
      FROM partner_profiles
      WHERE approval_status = 'approved'
    `);

      // Average rating
      const [ratingRows] = await pool.query(`
      SELECT ROUND(AVG(rating), 1) AS avgRating
      FROM reviews
      WHERE is_approved = 1
    `);

      // Total reviews
      const [reviewRows] = await pool.query(`
      SELECT COUNT(*) AS totalReviews
      FROM reviews
      WHERE is_approved = 1
    `);

      // Total active services
      const [serviceRows] = await pool.query(`
      SELECT COUNT(*) AS totalServices
      FROM services
      WHERE is_active = 1
    `);

      return {
        real_count: 1,
        counters: [
          {
            number: `${customerRows[0].totalCustomers}+`,
            title: "Happy Customers",
          },
          {
            number: `${ratingRows[0].avgRating || 0}`,
            title: "Average Rating",
          },
          {
            number: `${partnerRows[0].totalPartners}+`,
            title: "Approved Partners",
          },
          {
            number: `${reviewRows[0].totalReviews}+`,
            title: "Total Reviews",
          },
          {
            number: `${serviceRows[0].totalServices}+`,
            title: "Active Services",
          },
        ],
      };
    }

    // =====================================================
    // MANUAL COUNTERS
    // =====================================================

    const [rows] = await pool.query(`
    SELECT number, title
    FROM banner_counters
  `);

    return {
      real_count: 0,
      counters: rows,
    };
  },

  async upsertBanner(counters, real_count) {

    const conn = await pool.getConnection();

    await conn.beginTransaction();

    try {

      await conn.query("DELETE FROM banner_counters");

      for (const c of counters) {

        await conn.query(
          `
        INSERT INTO banner_counters
        (number, title, real_count)
        VALUES (?, ?, ?)
        `,
          [
            c.number,
            c.title,
            real_count ? 1 : 0,
          ]
        );
      }

      await conn.commit();

      conn.release();

    } catch (err) {

      await conn.rollback();

      conn.release();

      throw err;
    }
  },

  // ── Policies ─────────────────────────────────
  async getPolicies() {
    const [rows] = await pool.query(`
      SELECT id, title, content, created_at, updated_at
      FROM policies
      ORDER BY id ASC
    `);

    return rows;
  },

  async getPolicyById(id) {
    const [rows] = await pool.query(
      `SELECT id, title, content, created_at, updated_at FROM policies WHERE id = ? LIMIT 1`,
      [id]
    );
    return rows.length ? rows[0] : null;
  },

  async upsertPolicy({ id, title, content }) {
    // ensure table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS policies (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(255) NOT NULL,
        content LONGTEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    if (id) {
      await pool.query(`UPDATE policies SET title = ?, content = ? WHERE id = ?`, [title, content, id]);
    } else {
      await pool.query(`INSERT INTO policies (title, content) VALUES (?, ?)`, [title, content]);
    }

    return this.getPolicies();
  },

  async deletePolicy(id) {
    await pool.query(`DELETE FROM policies WHERE id = ?`, [id]);
    return true;
  },
};