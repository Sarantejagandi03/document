import api from "./api";

const documentService = {
  list: async () => (await api.get("/documents")).data,
  create: async (payload) => (await api.post("/documents", payload)).data,
  getById: async (id) => (await api.get(`/documents/${id}`)).data,
  update: async (id, payload) => (await api.put(`/documents/${id}`, payload)).data,
  delete: async (id) => (await api.delete(`/documents/${id}`)).data,
  share: async (id, payload) => (await api.post(`/documents/${id}/share`, payload)).data,
  removeCollaborator: async (id, userId) => (await api.delete(`/documents/${id}/share/${userId}`)).data,
  versions: async (id) => (await api.get(`/documents/${id}/versions`)).data,
  restoreVersion: async (id, versionId) =>
    (await api.post(`/documents/${id}/versions/${versionId}/restore`)).data,
};

export default documentService;
