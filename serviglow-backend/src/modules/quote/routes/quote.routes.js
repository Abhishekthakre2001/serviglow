import express from "express";
import {
  createQuote,
  getQuotes,
  deleteQuote,
  updateQuoteViewingStatus,
  getQuotespartneridwise,
  getQuotescustomeridwise,
  updateStatus,
} from "../controllers/quote.controller.js";
import { verifyUser }     from "../../../middleware/auth.middleware.js";
import { authorizeRoles } from "../../../middleware/role.middleware.js";

const router = express.Router();

router.post("/",           createQuote);
router.get("/",            verifyUser, getQuotes);
router.get("/partner",     verifyUser, getQuotespartneridwise);
router.get("/customer",    verifyUser, getQuotescustomeridwise);

router.patch("/status/:id",verifyUser, authorizeRoles("partner"), updateStatus);
router.patch("/view/:id",  verifyUser, updateQuoteViewingStatus);
router.delete("/:id",      verifyUser, authorizeRoles("partner"), deleteQuote);

export default router;