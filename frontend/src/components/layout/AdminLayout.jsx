"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modals";
import {
  Users,
  Bell,
  Search,
  Menu,
  LogOut,
  LayoutDashboard,
  Settings2,
  SquareUserRound,
  Briefcase,
  CircleDollarSign,
  NotebookPen,
  Contact,
  Quote,
  MessageSquare,
  UserCircle,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Alert from "@/components/ui/Conformation";
import Loader from "@/components/ui/loading";

import adminApi from "@/services/adminApi";

import NoAccess from "../../app/admin/noaccess/page";

const ROLE_MENUS = {
  superadmin: [
    { name: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
    { name: "Partners", icon: Users, href: "/admin/partners" },
    { name: "Master", icon: Settings2, href: "/admin/masters" },
    { name: "User's", icon: SquareUserRound, href: "/admin/users" },
    { name: "Inquiry", icon: Contact, href: "/admin/contacts" },
    { name: "Admin's", icon: UserCircle, href: "/admin/admins" },
    { name: "Reviews", icon: MessageSquare, href: "/admin/reviews" },
    { name: "Subscription", icon: SquareUserRound, href: "/admin/subscription" },
    { name: "Pricing", icon: Settings2, href: "/admin/priceing" },
    { name: "Account", icon: UserCircle, href: "/admin/account" },
    { name: "Content", icon: Settings2, href: "/admin/content" },
  ],

  admin: [
    { name: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
    { name: "Partners", icon: Users, href: "/admin/partners" },
    { name: "Master", icon: Settings2, href: "/admin/masters" },
    { name: "Customer", icon: SquareUserRound, href: "/admin/users" },
    { name: "Inquiry", icon: Contact, href: "/admin/contacts" },
    { name: "Admin's", icon: UserCircle, href: "/admin/admins" },
    { name: "Reviews", icon: MessageSquare, href: "/admin/reviews" },
    { name: "Subscription", icon: SquareUserRound, href: "/admin/subscription" },
    { name: "Account", icon: UserCircle, href: "/admin/account" },
    { name: "Content", icon: Settings2, href: "/admin/content" },
  ],


  customer: [{ name: "Dashboard", icon: LayoutDashboard, href: "/Users/dashboard" },
  { name: "My Booking", icon: NotebookPen, href: "/Users/mybooking" },
  { name: "Quotes", icon: Quote, href: "/Users/quotes" },
  { name: "Account", icon: UserCircle, href: "/Users/account" }
  ],
  partner: [
    { name: "Dashboard", icon: LayoutDashboard, href: "/partner/dashboard" },
    { name: "Services", icon: Briefcase, href: "/partner/services" },
    { name: "Quotes", icon: Quote, href: "/partner/quotes" },
    { name: "Subscription", icon: CircleDollarSign, href: "/partner/subscription" },
    { name: "Revenue", icon: CircleDollarSign, href: "/partner/revenue" },
    { name: "Bookings", icon: NotebookPen, href: "/partner/booking" },
    { name: "Reviews", icon: MessageSquare, href: "/partner/reviews" },
    { name: "Account", icon: UserCircle, href: "/partner/account" },
  ],
};

const ROUTE_PERMISSION_MAP = {
  "/admin/dashboard": "dashboard",

  "/admin/partners": "partners",

  "/admin/masters": "master_module",

  "/admin/users": "customer",

  "/admin/contacts": "inquiry",

  "/admin/admins": "admins",

  "/admin/reviews": "reviews",

  "/admin/subscription": "subscription",

  "/admin/account": "account",

  "/admin/content": "content",

  "/admin/priceing": "content",
};

export default function AdminLayout({ children }) {

  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);

  const [adminPermissions, setAdminPermissions] = useState(null);
  const [hasPageAccess, setHasPageAccess] = useState(true);


  const handlePermission = async (row) => {

    try {

      setLoading(true);

      const res = await adminApi.getAdminPermissions(row.id);

      console.log("PERMISSION RESPONSE =>", res.data);

      const permissions = res?.data?.data;

      // IF API RESPONSE NOT FOUND
      if (!permissions) {
        setAdminPermissions({});
        return;
      }

      setAdminPermissions({
        dashboard: 1,
        partners: Number(permissions.partners ?? 0),
        master_module: Number(permissions.master_module ?? 0),
        customer: Number(permissions.customer ?? 0),
        inquiry: Number(permissions.inquiry ?? 0),
        admins: Number(permissions.admins ?? 0),
        reviews: Number(permissions.reviews ?? 0),
        subscription: Number(permissions.subscription ?? 0),
        account: Number(permissions.account ?? 0),
        content: Number(permissions.content ?? 0),
      });

    } catch (error) {

      console.log(error);

      // IF API FAILS HIDE ALL MENUS
      setAdminPermissions({});

    } finally {

      setLoading(false);
    }
  };





  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    const handleSessionExpired = () => {
      setSessionExpired(true);
    };

    window.addEventListener("session-expired", handleSessionExpired);

    return () => {
      window.removeEventListener("session-expired", handleSessionExpired);
    };
  }, []);

  const handleSessionLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    router.push("/login");
  };

  const [userData, setUserData] = useState(null);
  const [hidePartnerMenus, setHidePartnerMenus] = useState(false);

  const [freebookinglimit, setFreeBookingLimit] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setFreeBookingLimit(localStorage.getItem("FREEBOOKINGLIMIT") === "true");
    }
  }, []);

  // useEffect(() => {
  //   const user = localStorage.getItem("USER");

  //   if (user) {
  //     const parsed = JSON.parse(user);
  //     setUserData(parsed);

  //     if (parsed?.role === "partner" && !parsed?.subscription) {
  //       setHidePartnerMenus(true);
  //     }
  //   }
  // }, []);

  useEffect(() => {
    const user = localStorage.getItem("USER");

    handlePermission(JSON.parse(user))

    const Subscription = localStorage.getItem("SUBSCRIPTION");

    const Role = localStorage.getItem("ROLE");

    if (Subscription) {
      const parseduserdata = JSON.parse(user);
      setUserData(parseduserdata);

      const Sub_data = JSON.parse(Subscription);


      if (Role === "partner") {
        const sub = Sub_data;

        const expiryDate = sub?.end_date;
        const today = new Date();

        const isExpired = expiryDate ? new Date(expiryDate) < today : true;

        console.log("Subscription", sub);
        console.log("isExpired", isExpired);

        const hasValidSubscription =
          sub &&
          sub.subscription === 1 &&
          sub.status === "ACTIVE" &&
          !isExpired;

        const isInactive = !hasValidSubscription;

        console.log("hasValidSubscription", hasValidSubscription);
        console.log("isInactive", isInactive);

        if (isInactive) {
          setHidePartnerMenus(true);
        }
      }
    }
  }, []);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [role, setRole] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {

    if (role !== "admin") {
      setHasPageAccess(true);
      return;
    }

    if (!adminPermissions) return;

    const matchedRoute = Object.keys(
      ROUTE_PERMISSION_MAP
    ).find(
      (route) =>
        pathname === route ||
        pathname.startsWith(route + "/")
    );

    // route not protected
    if (!matchedRoute) {
      setHasPageAccess(true);
      return;
    }

    const permissionKey =
      ROUTE_PERMISSION_MAP[matchedRoute];

    const allowed =
      Number(adminPermissions?.[permissionKey]) === 1;

    setHasPageAccess(allowed);

  }, [
    pathname,
    adminPermissions,
    role
  ]);

  useEffect(() => {
    setMounted(true);
    setRole(localStorage.getItem("ROLE")); // admin | user | partner
  }, []);

  useEffect(() => {
    setLoading(true);

    const timer = setTimeout(() => {
      setLoading(false);
    }, 400); // smooth transition

    return () => clearTimeout(timer);
  }, [pathname]);

  if (!mounted) return null;

  let mainMenu = ROLE_MENUS[role] || [];

  // =========================
  // ADMIN MENU PERMISSION FILTER
  // =========================

  if (role === "admin") {

    // Hide all menus until API response comes
    if (!adminPermissions) {
      mainMenu = [];
    } else {

      mainMenu = mainMenu.filter((menu) => {

        const permissionMap = {
          Dashboard: "dashboard",
          Partners: "partners",
          Master: "master_module",
          Customer: "customer",
          Inquiry: "inquiry",
          "Admin's": "admins",
          Reviews: "reviews",
          Subscription: "subscription",
          Account: "account",
          Content: "content",
        };

        const permissionKey = permissionMap[menu.name];

        return Number(adminPermissions?.[permissionKey]) === 1;
      });
    }
  }

  if (role === "partner" && hidePartnerMenus && !freebookinglimit) {
    mainMenu = mainMenu.filter(
      (item) =>
        ![
          "Services",
          "Quotes",
          "Revenue",
          "Bookings",
          "Reviews",
        ].includes(item.name)
    );
  }

  // const Token = localStorage.getItem("accessToken");
  // const Role = localStorage.getItem("ROLE");

  // console.log("userData", userData)

  return (
    <>
      {loading && <Loader />}
      <Alert
        open={logoutOpen}
        type="warning"
        title="Confirm Logout"
        message="Are you sure you want to logout?"
        onClose={() => setLogoutOpen(false)}
        onConfirm={() => {
          localStorage.clear();
          router.push("/login");
        }}
      />

      <Modal
        open={sessionExpired}
        onClose={() => setSessionExpired(false)}
        title="Session Expired"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <button
              onClick={handleSessionLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
            >
              Logout
            </button>
          </div>
        }
      >
        <div className="text-gray-600 text-sm">
          Your session has expired. Please login again to continue.
        </div>
      </Modal>

      <div className="flex h-screen bg-gray-100 overflow-hidden">
        {/* Mobile overlay */}
        {mobileMenuOpen && (
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
      fixed md:relative z-50 h-full w-64 bg-white shadow-lg
      transform transition-transform duration-300
      ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
    `}
        >
          {/* ✅ added overflow-y-auto */}
          <div className="p-6 h-full flex flex-col overflow-y-auto">

            <div className="flex justify-center mb-8">
              <img src="/logo-removebg.png" alt="Logo" className="h-12 object-contain" />
            </div>

            <nav className="flex-1 space-y-2">
              {mainMenu.map(({ name, icon: Icon, href }) => {
                const isActive = pathname === href || pathname.startsWith(href + "/");

                return (
                  <button
                    key={name}
                    onClick={() => {
                      router.push(href);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition
                ${isActive ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:bg-gray-100"}
              `}
                  >
                    <Icon size={18} />
                    {name}
                  </button>
                );
              })}
            </nav>

            {/* ✅ User Info + Logout (added) */}
            <div className="mt-auto pt-4 border-t">
              <div className="px-4 py-3 flex items-center gap-3 bg-gray-50 rounded-lg">

                {/* Avatar */}
                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-orange-500 text-white font-semibold uppercase">
                  {userData?.first_name?.[0]}
                  {userData?.last_name?.[0]}
                </div>

                {/* User Info */}
                <div className="flex flex-col">
                  <p className="text-sm font-semibold text-gray-800 leading-tight">
                    {userData?.first_name} {userData?.last_name}
                  </p>

                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    {/* Role Icon */}
                    <span className="inline-flex items-center gap-1 capitalize">
                      {userData?.role === "customer" ? "ServiGlow User" : userData?.role}
                    </span>
                  </div>
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={() => setLogoutOpen(true)}
                className="mt-3 w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-lg transition"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 bg-white flex items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 rounded-md hover:bg-gray-100"
              >
                <Menu size={20} />
              </button>

              {/* <div className="hidden md:flex items-center bg-gray-100 px-3 py-2 rounded-lg">
                <Search size={16} className="text-gray-400" />
                <input
                  placeholder="Search..."
                  className="ml-2 bg-transparent outline-none text-sm"
                />
              </div> */}
            </div>

            <div>
              {/* <button className="mx-4 relative p-2 hover:bg-gray-100 rounded-md">
                <Bell size={18} />
                <span className="absolute top-2 right-2 h-2 w-2 bg-green-600 rounded-full" />
              </button> */}

              <Link
                href="/"
                className="px-5 py-2 rounded-full font-semibold transition
          bg-gradient-to-r from-blue-600 to-orange-500 text-white"
              >
                Browse Services
              </Link>
            </div>
          </header>

          {/* <main className="flex-1 overflow-auto p-4 md:p-6">
            {children}
          </main> */}
          <main className="flex-1 overflow-auto p-4 md:p-6">

            {/* {role === "admin" &&
              adminPermissions &&
              Object.values(adminPermissions).every(
                (value) => Number(value) === 0
              ) ? (
              <NoAccess />
            ) : (
              children
            )} */}
            {role === "admin" &&
              adminPermissions &&
              !hasPageAccess ? (
              <NoAccess />
            ) : (
              children
            )}

          </main>
        </div>
      </div>

    </>
  );
}