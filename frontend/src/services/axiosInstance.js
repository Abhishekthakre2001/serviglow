import axios from "axios";

const ACCESS_TOKEN_KEY = "accessToken";
const AUTH_STORAGE_KEY = "authStorage"; // 'local' or 'session'

const getStorage = () => {
    const type = localStorage.getItem(AUTH_STORAGE_KEY) || "local";
    return type === "session" ? sessionStorage : localStorage;
};

const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    // baseURL: "https://apiserviglow.deveraa.com/api/v1",
    withCredentials: true, // needed for refresh token cookie
});

// 🔹 Request interceptor: attach Authorization header
axiosInstance.interceptors.request.use(
    (config) => {
        const storage = getStorage();
        const token = storage.getItem(ACCESS_TOKEN_KEY);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 🔹 Response interceptor: auto-refresh on 401 and retry
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((p) => {
        if (error) p.reject(error);
        else p.resolve(token);
    });
    failedQueue = [];
};

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalConfig = error.config;

        if (
            error.response &&
            error.response.status === 401 &&
            !originalConfig._retry &&
            !originalConfig.url.includes("/auth/login") &&
            !originalConfig.url.includes("/auth/refresh")
        ) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalConfig.headers.Authorization = `Bearer ${token}`;
                        return axiosInstance(originalConfig);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalConfig._retry = true;
            isRefreshing = true;

            try {
                const refreshResponse = await axios.post(
                    `${axiosInstance.defaults.baseURL}/auth/refresh`,
                    {},
                    { withCredentials: true }
                );

                const newToken = refreshResponse.data.accessToken;

                if (newToken) {
                    const storage = getStorage();
                    storage.setItem(ACCESS_TOKEN_KEY, newToken);
                }

                isRefreshing = false;
                processQueue(null, newToken);

                originalConfig.headers.Authorization = `Bearer ${newToken}`;
                return axiosInstance(originalConfig);
            } catch (err) {
                isRefreshing = false;
                processQueue(err, null);

                // clear tokens and optionally redirect
                const storage = getStorage();
                storage.removeItem(ACCESS_TOKEN_KEY);
                localStorage.removeItem(AUTH_STORAGE_KEY);
                storage.removeItem("user");

                // redirect to login page
                if (typeof window !== "undefined") {
                    window.location.href = "/";
                }
                // You can do: window.location.href = "/login";
                return Promise.reject(err);
            }
        }

        /* ================= 403 (SESSION EXPIRED) ================= */
        if (error.response && error.response.status === 403) {
            console.log("Session expired");

            // 🔥 Trigger global event
            window.dispatchEvent(new Event("session-expired"));
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
