import express from "express";

import {
  createDocument,
  deleteDocument,
  getDocumentById,
  getVersions,
  listDocuments,
  removeCollaborator,
  restoreVersion,
  shareDocument,
  updateDocument,
} from "../controllers/documentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.route("/").get(listDocuments).post(createDocument);
router.route("/:id").get(getDocumentById).put(updateDocument).delete(deleteDocument);
router.post("/:id/share", shareDocument);
router.delete("/:id/share/:userId", removeCollaborator);
router.get("/:id/versions", getVersions);
router.post("/:id/versions/:versionId/restore", restoreVersion);

export default router;
