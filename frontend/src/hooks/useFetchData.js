import { useEffect, useState } from "react";

export const useFetchData = (apiFunc, deps = []) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = () => {
        setLoading(true);
        return Promise.resolve()
            .then(() => apiFunc())
            .then(res => setData(res.data ?? res))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

    return { data, loading, reload: load };
};