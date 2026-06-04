import { useState, useCallback } from "react";
import authApi from "@/services/authApi";

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const registerPartner = useCallback(async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authApi.registerPartner(formData);
      return response.data;
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || err.message || "Registration failed";
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const registerUser = useCallback(async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authApi.registerUser(formData);
      return response.data;
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || err.message || "Registration failed";
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);


  // ✅ Single login function
  const login = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authApi.login(payload);

      const { accessToken, refreshToken } = response?.data;

      if (accessToken) {
        localStorage.setItem("accessToken", accessToken);
      }

      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }

      return response.data;
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || err.message || "Login failed";
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);


  const sendOtp = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authApi.sendOtp(payload);
      console.log(response?.data);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "failed";
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyOtp = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authApi.verifyOtp(payload);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "failed";
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setError(null);
  }, []);

  return {
    verifyOtp,
    sendOtp,
    login,
    registerUser,
    loading,
    error,
    registerPartner,
    logout,
  };
};
