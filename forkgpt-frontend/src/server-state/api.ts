import axios from "axios";
import { supabase } from "../supabase";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Add Supabase session token to requests
api.interceptors.request.use(async (config) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);
