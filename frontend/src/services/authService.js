import api from "./api";

const authService = {
  signup: async (payload) => {
    const { data } = await api.post("/auth/signup", payload);
    return data;
  },
  login: async (payload) => {
    const { data } = await api.post("/auth/login", payload);
    return data;
  },
  me: async () => {
    const { data } = await api.get("/auth/me");
    return data;
  },
};

export default authService;
