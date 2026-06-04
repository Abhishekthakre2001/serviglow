"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Loader from "@/components/ui/loading";
import { usePathname } from "next/navigation";
import cmsApi from "@/services/cms";

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [open, setOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  // ADD THIS
  const [announcement, setAnnouncement] = useState("");

  // ADD THIS
  useEffect(() => {
    fetchAnnouncement();
  }, []);

  // ADD THIS
  const fetchAnnouncement = async () => {

    try {

      const res = await cmsApi.getAnnouncement();

      if (res.data?.data?.announcement) {
        setAnnouncement(res.data.data.announcement);
      }

    } catch (error) {
      console.log(error);
    }
  };



  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      setShowTop(y > 300);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setLoading(true);

    const timer = setTimeout(() => {
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [pathname]);

  const checkAuthState = () => {
    if (typeof window === "undefined") return;

    const isLoggedIn = localStorage.getItem("IS_LOGGED_IN") === "true";
    const role = localStorage.getItem("ROLE");

    setIsLoggedIn(isLoggedIn);
    setUserRole(role);
  };

  useEffect(() => {
    checkAuthState();
  }, [pathname]);

  const getDashboardPath = () => {
    if (!isLoggedIn) return "/login";

    switch (userRole) {
      case "customer":
        return "/Users/dashboard";
      case "superadmin":
        return "/admin/dashboard";
      case "partner":
        return "/partner/dashboard";
      case "admin":
        return "/admin/dashboard";
      default:
        return "/";
    }
  };

  useEffect(() => {
    const handleStorageChange = () => {
      checkAuthState();
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const isActive = (path) =>
    path === "/"
      ? pathname === "/"
      : pathname === path || pathname.startsWith(path + "/");

  const scrollToTop = () =>
    window.scrollTo({ top: 0, behavior: "smooth" });

  const menuClass = (path) =>
    `relative font-medium transition ${isActive(path)
      ? "text-blue-600 after:absolute after:-bottom-1 after:left-0 after:w-full after:h-[2px] after:bg-gradient-to-r after:from-blue-600 after:to-orange-500"
      : "text-gray-700 hover:text-blue-600"
    }`;

  return (
    <>
      {loading && <Loader />}
      {/* ANNOUNCEMENT BAR */}
      {/* DYNAMIC ANNOUNCEMENT BAR */}
      {announcement && (
        <div
          className={`fixed top-0 left-0 w-full z-50 transition-all duration-300
    ${scrolled
              ? "-translate-y-full opacity-0"
              : "translate-y-0 opacity-100"
            }
    bg-gradient-to-r from-blue-600 to-orange-500 text-white shadow-md`}
        >
          <marquee
            behavior="scroll"
            direction="left"
            scrollamount="5"
            className="py-1 text-sm md:text-base font-medium"
          >
            {announcement}
          </marquee>
        </div>
      )}
      {/* NAVBAR */}
      <header
        className={`fixed left-0 w-full z-40 transition-all duration-300
        ${scrolled
            ? "top-0 bg-white shadow-md py-3"
            : "top-10 bg-white/80 backdrop-blur py-4"
          }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* LOGO */}
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="ServiGlow"
              className={`transition-all duration-300 ${scrolled ? "h-10" : "h-12"
                }`}
            />
          </Link>

          {/* DESKTOP MENU */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className={menuClass("/")}>Home</Link>
            <Link href="/services" className={menuClass("/services")}>Services</Link>
            <Link href="/review" className={menuClass("/review")}>Reviews</Link>
            <Link href="/contact" className={menuClass("/contact")}>Contact</Link>
          </nav>

          {/* AUTH */}
          <div className="hidden md:flex gap-4 items-center">
            {isLoggedIn ? (
              <Link
                href={getDashboardPath()}
                onClick={() => setOpen(false)}
                className="text-center px-5 py-3 rounded-full text-white font-semibold
    bg-gradient-to-r from-blue-600 to-orange-500 shadow-md"
              >
                My Dashboard
              </Link>
            ) : (
              <>

                <Link
                  href="/pathner_registration"
                  className={`px-5 py-2 rounded-full font-semibold transition ${isActive("/registration")
                    ? "bg-gradient-to-r from-blue-600 to-orange-500 text-white"
                    : "bg-gradient-to-r from-blue-600 to-orange-500 text-white hover:shadow-lg"
                    }`}
                >
                  Become a Partner
                </Link>

                <Link
                  href="/login"
                  className={`px-5 py-2 rounded-full font-semibold transition ${isActive("/login")
                    ? "bg-blue-600 text-white"
                    : "border border-blue-600 text-blue-600 hover:bg-blue-50"
                    }`}
                >
                  Login
                </Link>

                <Link
                  href="/registration"
                  className={`px-5 py-2 rounded-full font-semibold transition ${isActive("/registration")
                    ? "bg-gradient-to-r from-blue-600 to-orange-500 text-white"
                    : "bg-gradient-to-r from-blue-600 to-orange-500 text-white hover:shadow-lg"
                    }`}
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* MOBILE MENU BUTTON */}
          <button
            className="md:hidden text-2xl"
            onClick={() => setOpen(!open)}
          >
            ☰
          </button>
        </div>
      </header>

      {/* MOBILE DRAWER */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ${open ? "visible opacity-100" : "invisible opacity-0"
          }`}
      >
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />

        <div
          className={`absolute top-0 right-0 h-full w-72 bg-white shadow-2xl
          transition-transform duration-300
          ${open ? "translate-x-0" : "translate-x-full"}`}
        >
          <div className="flex items-center justify-between p-5 border-b border-gray-300">
            <img
              src="/logo.png"
              alt="ServiGlow"
              className={`transition-all duration-300 ${scrolled ? "h-10" : "h-12"
                }`}
            />
            <button
              onClick={() => setOpen(false)}
              className="text-2xl font-bold text-gray-600"
            >
              ✕
            </button>
          </div>

          <nav className="flex flex-col gap-2 p-5 font-medium text-gray-700">
            {[
              { name: "Home", path: "/" },
              { name: "Services", path: "/services" },
              { name: "Reviews", path: "/review" },
              { name: "Contact", path: "/contact" },
            ].map((item) => (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setOpen(false)}
                className={`px-4 py-3 rounded-xl transition ${isActive(item.path)
                  ? "bg-gradient-to-r from-blue-600 to-orange-500 text-white"
                  : "hover:bg-gray-100"
                  }`}
              >
                {item.name}
              </Link>
            ))}

            <div className="border-t border-gray-300 mt-4 pt-4 flex flex-col gap-3">
              {isLoggedIn ? (
                <Link
                  href={getDashboardPath()}
                  className="px-7 py-2 rounded-full font-semibold text-white
                  bg-gradient-to-r from-blue-600 to-orange-500 hover:shadow-lg"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/pathner_registration"
                    className={`text-center px-5 py-2 rounded-full font-semibold transition ${isActive("/registration")
                      ? "bg-gradient-to-r from-blue-600 to-orange-500 text-white"
                      : "bg-gradient-to-r from-blue-600 to-orange-500 text-white hover:shadow-lg"
                      }`}
                  >
                    Become a Partner
                  </Link>

                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="text-center py-3 rounded-full border border-blue-600 text-blue-600 font-semibold"
                  >
                    Login
                  </Link>

                  <Link
                    href="/registration"
                    onClick={() => setOpen(false)}
                    className="text-center py-3 rounded-full text-white font-semibold bg-gradient-to-r from-blue-600 to-orange-500 shadow-md"
                  >
                    Register
                  </Link>


                </>
              )}
            </div>
          </nav>
        </div>
      </div>

      {/* BACK TO TOP */}
      {showTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full
          bg-gradient-to-r from-blue-600 to-orange-500 text-white
          shadow-lg hover:scale-110 transition"
        >
          ↑
        </button>
      )}

      {/* SPACER */}
      <div className={scrolled ? "h-[80px]" : "h-[120px]"} />
    </>
  );
}