import { useState, useEffect } from "react";

const useServerPagination = (apiCall, options = {}) => {
  const {
    initialPage = 1,
    initialLimit = 5,
    dependencies = [],
    formatData,
  } = options;

  const [data, setData] = useState([]);
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchData = async () => {
    try {
      setLoading(true);

      const res = await apiCall(page, limit);

      const rawData = res?.data?.data || [];
      const formatted = formatData ? formatData(rawData) : rawData;

      setData(formatted);
      setTotalPages(res?.data?.pagination?.totalPages || 1);

    } catch (err) {
      console.error("Pagination fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, limit, ...dependencies, refreshKey]);

  const refetch = () => setRefreshKey((prev) => prev + 1);


  return {
    data,
    loading,
    page,
    limit,
    totalPages,
    setPage,
    setLimit,
    refresh: fetchData,
    refetch
  };
};

export default useServerPagination;