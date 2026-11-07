import axios from "axios";
import { API_BASE } from "../constants";

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 120000,
});

export default apiClient;

