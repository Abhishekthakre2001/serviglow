// import {
//   Phone,
//   Mail,
//   MapPin,
//   Facebook,
//   Instagram,
//   Twitter,
//   Linkedin,
//   ShieldCheck,
//   Star,
//   Wrench,
// } from "lucide-react";
// import Link from "next/link";

// export default function Footer() {
//   return (
//     <footer className="bg-gradient-to-br from-gray-900 via-gray-950 to-black text-gray-300">

//       {/* ================= TOP TRUST BAR ================= */}
//       <div className="border-b border-gray-800">
//         <div className="max-w-7xl mx-auto px-6 py-10 grid gap-6 md:grid-cols-3 text-sm">

//           <div className="flex items-center gap-4">
//             <ShieldCheck className="text-blue-500" />
//             <span>Verified & Trusted Professionals</span>
//           </div>

//           <div className="flex items-center gap-4">
//             <Star className="text-orange-400" />
//             <span>4.8★ Rated by 10,000+ Customers</span>
//           </div>

//           <div className="flex items-center gap-4">
//             <Wrench className="text-blue-500" />
//             <span>On-Demand Home Services</span>
//           </div>

//         </div>
//       </div>

//       {/* ================= MAIN FOOTER ================= */}
//       <div className="max-w-7xl mx-auto px-6 py-16 grid gap-14
//                       sm:grid-cols-2 md:grid-cols-3">

//         {/* BRAND */}
//         <div>
//           <h3 className="text-3xl font-extrabold text-white mb-4">
//             <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-orange-500">
//               ServiGlow
//             </span>
//           </h3>

//           <p className="text-sm leading-relaxed text-gray-400">
//             Premium home services delivered by trusted professionals.
//             Transparent pricing, fast support, and guaranteed satisfaction.
//           </p>

//           {/* SOCIAL */}
//           <div className="flex gap-4 mt-6">
//             <a className="p-2 rounded-full bg-gray-800 hover:bg-blue-600 transition">
//               <Facebook size={18} />
//             </a>
//             <a className="p-2 rounded-full bg-gray-800 hover:bg-pink-600 transition">
//               <Instagram size={18} />
//             </a>
//             <a className="p-2 rounded-full bg-gray-800 hover:bg-sky-500 transition">
//               <Twitter size={18} />
//             </a>
//             <a className="p-2 rounded-full bg-gray-800 hover:bg-blue-700 transition">
//               <Linkedin size={18} />
//             </a>
//           </div>
//         </div>


//         {/* QUICK LINKS */}
//         <div>
//           <h4 className="text-white font-semibold mb-5">Quick Links</h4>
//           <ul className="space-y-3 text-sm">

//             <li>
//               <Link href="/" className="hover:text-white transition">
//                 Home
//               </Link>
//             </li>

//             <li>
//               <Link href="/services" className="hover:text-white transition">
//                 Services
//               </Link>
//             </li>

//             <li>
//               <Link href="/review" className="hover:text-white transition">
//                 Review
//               </Link>
//             </li>

//             <li>
//               <Link href="/login" className="hover:text-white transition">
//                 Login
//               </Link>
//             </li>

//             <li>
//               <Link href="/registration" className="hover:text-white transition">
//                 Registration
//               </Link>
//             </li>

//             <li>
//               <Link href="/contact" className="hover:text-white transition">
//                 Contact
//               </Link>
//             </li>

//           </ul>
//         </div>

//         {/* CONTACT */}
//         <div>
//           <h4 className="text-white font-semibold mb-5">Contact Us</h4>

//           <ul className="space-y-4 text-sm">
//             <li className="flex items-center gap-3">
//               <MapPin size={18} className="text-blue-500" />
//               <span>
//                 ServiGlow Inc.<br />
//                 245 Market Street, Suite 210<br />
//                 San Francisco, CA 94105<br />
//                 United States
//               </span>
//             </li>

//             <li className="flex items-center gap-3">
//               <Phone size={18} className="text-blue-500" />
//               +91 99999 88888
//             </li>

//             <li className="flex items-center gap-3">
//               <Mail size={18} className="text-blue-500" />
//               support@serviglow.com
//             </li>
//           </ul>

//           {/* <div className="mt-6 inline-block px-4 py-2 rounded-xl
//                           bg-gradient-to-r from-green-500 to-emerald-600
//                           text-white text-sm font-semibold shadow-lg">
//             WhatsApp Support Available
//           </div> */}
//         </div>
//       </div>

//       {/* ================= BOTTOM ================= */}
//       <div className="border-t border-gray-800">
//         <div className="max-w-7xl mx-auto px-6 py-6
//                         flex flex-col md:flex-row
//                         justify-between items-center gap-4 text-sm">

//           <p className="text-gray-400">
//             © {new Date().getFullYear()} ServiGlow All rights reserved.
//           </p>

//           <div className="flex gap-6">
//             <div className="flex gap-6">
//               <Link href="/privacy-policy" className="hover:text-white transition">
//                 Privacy Policy
//               </Link>

//               <Link href="/terms" className="hover:text-white transition">
//                 Terms & Conditions
//               </Link>
//             </div>
//             {/* <a className="hover:text-white transition">Refund Policy</a> */}
//           </div>
//         </div>
//       </div>
//     </footer>
//   );
// }




"use client";

import { useEffect, useState } from "react";
import {
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  ShieldCheck,
  Star,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import cmsApi from "@/services/cms";



/* ================= SOCIAL LABEL HELPER ================= */
const getSocialLabel = (platform = "") => {
  const map = {
    facebook: "FB",
    instagram: "IG",
    twitter: "X",
    linkedin: "IN",
    youtube: "YT",
    whatsapp: "WA",
  };

  return map[platform?.toLowerCase()] || platform.slice(0, 2).toUpperCase();
};

export default function Footer() {
  const [footer, setFooter] = useState();
  const [policies, setPolicies] = useState([]);

  useEffect(() => {
    const fetchFooter = async () => {
      try {
        const res = await cmsApi.getFooter();
        if (res?.data?.data) {
          setFooter(res.data.data);
        }
      } catch (err) {
        console.log("Footer load failed, using default");
      }
    };

    const fetchPolicies = async () => {
      try {
        const res = await cmsApi.getPolicies();
        setPolicies(res?.data?.data || []);
      } catch (err) {
        // ignore
      }
    };

    fetchFooter();
    fetchPolicies();
  }, []);

  const data = footer;


  console.log("policies", policies)
  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-950 to-black text-gray-300">

      {/* ================= TOP TRUST BAR ================= */}
      {data?.highlights?.length > 0 && (
        <div className="border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-6 py-10 grid gap-4 md:grid-cols-3 text-sm">

            {data.highlights.map((item, index) => (
              <div
                key={index}
                className="flex items-center"
              >
                <span>{item.text}</span>
              </div>
            ))}

          </div>
        </div>
      )}

      {/* ================= MAIN FOOTER ================= */}
      <div className="max-w-7xl mx-auto px-6 py-16 grid gap-14 sm:grid-cols-2 md:grid-cols-3">

        {/* BRAND (always visible) */}
        <div>
          <h3 className="text-3xl font-extrabold text-white mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-orange-500">
              {data?.company?.name || "ServiGlow"}
            </span>
          </h3>

          {data?.company?.description && (
            <p className="text-sm leading-relaxed text-gray-400">
              {data.company.description}
            </p>
          )}

          {/* SOCIAL BADGES */}
          {data?.company?.socials?.length > 0 && (
            <div className="flex gap-3 mt-6">
              {data.company.socials.map((social, idx) => (
                <a
                  key={idx}
                  href={social?.link || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-800 hover:bg-blue-600 transition text-xs font-semibold"
                >
                  {getSocialLabel(social?.platform)}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* QUICK LINKS */}
        {data?.quickLinks?.length > 0 && (
          <div>
            <h4 className="text-white font-semibold mb-5">Quick Links</h4>
            <ul className="space-y-3 text-sm">
              {data.quickLinks.map((item, idx) => (
                <li key={idx}>
                  <Link href={item?.link || "#"} className="hover:text-white transition">
                    {item?.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* CONTACT */}
        {data?.contact && (
          <div>
            <h4 className="text-white font-semibold mb-5">Contact Us</h4>

            <ul className="space-y-4 text-sm">

              {data?.contact?.companyName && (
                <li className="flex items-center gap-3">
                  <MapPin size={18} className="text-blue-500" />
                  <span>
                    {data.contact.companyName}
                    <br />
                    {data.contact.address}
                  </span>
                </li>
              )}

              {data?.contact?.phone && (
                <li className="flex items-center gap-3">
                  <Phone size={18} className="text-blue-500" />
                  {data.contact.phone}
                </li>
              )}

              {data?.contact?.email && (
                <li className="flex items-center gap-3">
                  <Mail size={18} className="text-blue-500" />
                  {data.contact.email}
                </li>
              )}

            </ul>
          </div>
        )}

      </div>

      {/* ================= BOTTOM ================= */}
      {data?.bottom && (
        <div className="border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">

            <p className="text-gray-400">
              © {new Date().getFullYear()} {data?.company?.name || "ServiGlow"} All rights reserved.
            </p>

            <div className="flex gap-6">
              {/* {data?.bottom?.links?.map((item, idx) => (
                <Link key={`b-${idx}`} href={item?.link || "#"} className="hover:text-white transition">
                  {item?.label}
                </Link>
              ))} */}

              {policies?.map((p) => (
                <Link key={`p-${p.id}`} href={`/policies/${p.id}`} className="hover:text-white transition">
                  {p.title}
                </Link>
              ))}
            </div>

          </div>
        </div>
      )}

    </footer>
  );
}