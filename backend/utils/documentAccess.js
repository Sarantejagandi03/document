const getId = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (value._id) return value._id.toString();
  return value.toString();
};

const getUserRole = (document, userId) => {
  if (!document || !userId) return null;
  if (getId(document.owner) === getId(userId)) return "owner";

  const collaborator = document.collaborators.find(
    (entry) => getId(entry.user) === getId(userId)
  );

  return collaborator?.role || null;
};

const canViewDocument = (document, userId) => Boolean(getUserRole(document, userId));

const canEditDocument = (document, userId) => {
  const role = getUserRole(document, userId);
  return role === "owner" || role === "editor";
};

export { getUserRole, canViewDocument, canEditDocument };
