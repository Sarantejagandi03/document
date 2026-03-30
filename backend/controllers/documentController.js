import mongoose from "mongoose";

import Document from "../models/Document.js";
import DocumentVersion from "../models/DocumentVersion.js";
import User from "../models/User.js";
import { canEditDocument, canViewDocument, getUserRole } from "../utils/documentAccess.js";

const getId = (value) => (value?._id ? value._id.toString() : value?.toString());

const documentQuery = [
  { path: "owner", select: "name email" },
  { path: "collaborators.user", select: "name email" },
  { path: "lastEditedBy", select: "name email" },
];

const formatDocument = (document, userId) => ({
  _id: document._id,
  title: document.title,
  content: document.content,
  owner: document.owner,
  collaborators: document.collaborators,
  lastEditedBy: document.lastEditedBy,
  createdAt: document.createdAt,
  updatedAt: document.updatedAt,
  currentUserRole: getUserRole(document, userId),
});

const listDocuments = async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user._id);
  const documents = await Document.find({
    $or: [{ owner: userId }, { "collaborators.user": userId }],
  })
    .populate(documentQuery)
    .sort({ updatedAt: -1 });

  res.json({
    documents: documents.map((document) => formatDocument(document, req.user._id)),
  });
};

const createDocument = async (req, res) => {
  const { title } = req.body;

  const document = await Document.create({
    title: title?.trim() || "Untitled document",
    content: "",
    owner: req.user._id,
    collaborators: [{ user: req.user._id, role: "editor" }],
    lastEditedBy: req.user._id,
  });

  await document.populate(documentQuery);

  res.status(201).json({ document: formatDocument(document, req.user._id) });
};

const getDocumentById = async (req, res) => {
  const document = await Document.findById(req.params.id).populate(documentQuery);

  if (!document) {
    return res.status(404).json({ message: "Document not found" });
  }

  if (!canViewDocument(document, req.user._id)) {
    return res.status(403).json({ message: "You do not have access to this document" });
  }

  return res.json({ document: formatDocument(document, req.user._id) });
};

const saveVersionSnapshot = async (document, userId) => {
  await DocumentVersion.create({
    document: document._id,
    title: document.title,
    content: document.content,
    savedBy: userId,
  });

  const versionCount = await DocumentVersion.countDocuments({ document: document._id });
  if (versionCount > 20) {
    const oldestVersions = await DocumentVersion.find({ document: document._id })
      .sort({ createdAt: 1 })
      .limit(versionCount - 20)
      .select("_id");

    await DocumentVersion.deleteMany({
      _id: { $in: oldestVersions.map((version) => version._id) },
    });
  }
};

const updateDocument = async (req, res) => {
  const document = await Document.findById(req.params.id).populate(documentQuery);

  if (!document) {
    return res.status(404).json({ message: "Document not found" });
  }

  if (!canEditDocument(document, req.user._id)) {
    return res.status(403).json({ message: "Editing not allowed for this document" });
  }

  await saveVersionSnapshot(document, req.user._id);

  const { title, content } = req.body;
  if (typeof title === "string") document.title = title.trim() || "Untitled document";
  if (typeof content === "string") document.content = content;
  document.lastEditedBy = req.user._id;

  await document.save();
  await document.populate(documentQuery);

  return res.json({ document: formatDocument(document, req.user._id) });
};

const deleteDocument = async (req, res) => {
  const document = await Document.findById(req.params.id);

  if (!document) {
    return res.status(404).json({ message: "Document not found" });
  }

  if (getId(document.owner) !== getId(req.user._id)) {
    return res.status(403).json({ message: "Only the owner can delete this document" });
  }

  await DocumentVersion.deleteMany({ document: document._id });
  await document.deleteOne();

  return res.json({ message: "Document deleted successfully" });
};

const shareDocument = async (req, res) => {
  const { email, role } = req.body;
  const document = await Document.findById(req.params.id).populate(documentQuery);

  if (!document) {
    return res.status(404).json({ message: "Document not found" });
  }

  if (getId(document.owner) !== getId(req.user._id)) {
    return res.status(403).json({ message: "Only the owner can share this document" });
  }

  if (!email || !["viewer", "editor"].includes(role)) {
    return res.status(400).json({ message: "Valid email and role are required" });
  }

  const collaboratorUser = await User.findOne({ email: email.toLowerCase().trim() });
  if (!collaboratorUser) {
    return res.status(404).json({ message: "User with this email was not found" });
  }

  if (getId(collaboratorUser._id) === getId(document.owner)) {
    return res.status(400).json({ message: "Owner already has full access" });
  }

  const existingCollaborator = document.collaborators.find(
    (entry) => getId(entry.user) === getId(collaboratorUser._id)
  );

  if (existingCollaborator) {
    existingCollaborator.role = role;
  } else {
    document.collaborators.push({ user: collaboratorUser._id, role });
  }

  await document.save();
  await document.populate(documentQuery);

  return res.json({ document: formatDocument(document, req.user._id) });
};

const removeCollaborator = async (req, res) => {
  const document = await Document.findById(req.params.id).populate(documentQuery);

  if (!document) {
    return res.status(404).json({ message: "Document not found" });
  }

  if (getId(document.owner) !== getId(req.user._id)) {
    return res.status(403).json({ message: "Only the owner can remove collaborators" });
  }

  document.collaborators = document.collaborators.filter(
    (entry) => getId(entry.user) !== req.params.userId
  );

  await document.save();
  await document.populate(documentQuery);

  return res.json({ document: formatDocument(document, req.user._id) });
};

const getVersions = async (req, res) => {
  const document = await Document.findById(req.params.id);

  if (!document) {
    return res.status(404).json({ message: "Document not found" });
  }

  if (!canViewDocument(document, req.user._id)) {
    return res.status(403).json({ message: "You do not have access to this document" });
  }

  const versions = await DocumentVersion.find({ document: document._id })
    .populate("savedBy", "name email")
    .sort({ createdAt: -1 })
    .limit(20);

  return res.json({ versions });
};

const restoreVersion = async (req, res) => {
  const document = await Document.findById(req.params.id).populate(documentQuery);

  if (!document) {
    return res.status(404).json({ message: "Document not found" });
  }

  if (!canEditDocument(document, req.user._id)) {
    return res.status(403).json({ message: "Editing not allowed for this document" });
  }

  const version = await DocumentVersion.findOne({
    _id: req.params.versionId,
    document: document._id,
  });

  if (!version) {
    return res.status(404).json({ message: "Version not found" });
  }

  await saveVersionSnapshot(document, req.user._id);

  document.title = version.title;
  document.content = version.content;
  document.lastEditedBy = req.user._id;
  await document.save();
  await document.populate(documentQuery);

  return res.json({ document: formatDocument(document, req.user._id) });
};

export {
  listDocuments,
  createDocument,
  getDocumentById,
  updateDocument,
  deleteDocument,
  shareDocument,
  removeCollaborator,
  getVersions,
  restoreVersion,
};
