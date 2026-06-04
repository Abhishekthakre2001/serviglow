"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminGuard({ children }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem("ROLE");
    const isLoggedIn = localStorage.getItem("IS_LOGGED_IN");

    if (role === "admin" || "superadmin" && isLoggedIn === "true") {
      setAuthorized(true);
    } else {
      router.replace("/admin/");
    }
  }, [router]);

  if (!authorized) return null; // or loading spinner

  return children;
}
