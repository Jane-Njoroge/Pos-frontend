import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5003/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (username: string, password: string) =>
    api.post("/auth/login", { username, password }),
  getCurrentUser: () => api.get("/auth/me"),
};

// Products API
export const productsAPI = {
  getAll: () => api.get("/products"),
  getByBarcode: (barcode: string) => api.get(`/products/barcode/${barcode}`),
  search: (query: string) => api.get(`/products/search?query=${query}`),
  create: (productData: any) => api.post("/products", productData),
  update: (id: number, productData: any) =>
    api.put(`/products/${id}`, productData),
};

// Categories API
export const categoriesAPI = {
  getAll: () => api.get("/categories"),
  create: (categoryData: any) => api.post("/categories", categoryData),
};

// Transactions API
export const transactionsAPI = {
  create: (transactionData: any) => api.post("/transactions", transactionData),
  getAll: (limit?: number, offset?: number) =>
    api.get(`/transactions?limit=${limit || 50}&offset=${offset || 0}`),
  getById: (id: number) => api.get(`/transactions/${id}`),
};

export default api;
