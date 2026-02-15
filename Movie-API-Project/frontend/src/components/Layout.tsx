import React from "react";
import { Outlet, useLocation } from "react-router-dom";
// import Navbar from "@/components/Navbar";
// import Footer from "@/components/Footer";
import Sidebar from "@/components/Sidebar";

const Layout: React.FC = () => {
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      {/* <Navbar /> */}
      <div className="flex flex-1 relative">
        {isHomePage && <Sidebar />}
        <main
          className={`flex-grow ${isHomePage ? "pl-64" : "container mx-auto px-4"}`}
        >
          <Outlet />
        </main>
      </div>
      {/* <Footer /> */}
    </div>
  );
};

export default Layout;
