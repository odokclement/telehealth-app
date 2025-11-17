import React, { createContext, useEffect, useState } from "react";
import axios from "axios";
import { axiosInstance } from "../lib/axios";

const StreamContext = createContext();

// 2. Provider component
const StreamProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isPending, setIsPending] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getToken = async () => {
      setError(null);
      try {
        const res = await axiosInstance("stream/get-token");
        if (res.status !== 200)
          throw new Error("An error occured while getting token");
        const { user, token } = res.data;
        setUser(user);
        setToken(token);
      } catch (error) {
        setError(error);
        console.log("Token Error:", error);
      } finally {
        setIsPending(false);
      }
    };
    getToken();
  }, []);

  const logout = async () => {
    try {
      await axios.post("/users/logout");

      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      localStorage.removeItem("streamToken");

      // Clear context
      setUser(null);
      setToken(null);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Stream...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center w-full ">
        <div className="text-center text-red-600">
          <p className="text-xl mb-2">Failed to load Stream</p>
          <p className="text-sm">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  return (
    <StreamContext.Provider
      value={{ isPending, error, user, token, Logout: logout }}
    >
      {children}
    </StreamContext.Provider>
  );
};

// 3. Custom hook for easy access
export { StreamContext, StreamProvider };