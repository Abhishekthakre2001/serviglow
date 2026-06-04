import { useState } from "react";

export const useCreate = (apiFunc, onSuccess) => {
    const [loading, setLoading] = useState(false);

    const create = async (payload) => {
        setLoading(true);
        try {
            const res = await apiFunc(payload);
            onSuccess(res.data);
        } finally {
            setLoading(false);
        }
    };

    return { create, loading };
};
