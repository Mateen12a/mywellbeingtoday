import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  Sun,
  Moon,
  ChevronDown,
  LogOut,
  User,
  Settings,
  LayoutDashboard,
  Bell,
  Info,
  HelpCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ghwLogo from "../assets/ghw-logo.png";
import NotificationBell from "./NotificationBell";

const API_URL = import.meta.env.VITE_API_URL;

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const userMenuRef = useRef();

  const isLandingPage = location.pathname === "/";

  const needsLightContent = isLandingPage && !scrolled;

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const logout = () => {
    ["token", "user", "role"].forEach((k) => localStorage.removeItem(k));
    navigate("/login");
  };

  const getDashboardLink = () => {
    if (!user) return "/login";
    if (user.role?.toLowerCase().includes("admin")) return "/dashboard/admin";
    if (user.role?.toLowerCase().includes("solution")) return "/dashboard/sp";
    return "/dashboard/to";
  };

  const scrollToHowItWorks = (e) => {
    e.preventDefault();
    setMenuOpen(false);
    if (isLandingPage) {
      const element = document.getElementById('how-it-works');
      if (element) {
        const navHeight = 80;
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({
          top: elementPosition - navHeight,
          behavior: 'smooth'
        });
      }
    } else {
      navigate('/#how-it-works');
    }
  };

  const profileImage = user?.profileImage
    ? `${API_URL}${user.profileImage}`
    : null;

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
  isLandingPage
    ? "bg-white border-b border-gray-100"
    : scrolled
      ? "bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200/50"
      : "bg-white  border-b border-gray-100"
}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link to={user ? getDashboardLink() : "/"} className="flex items-center gap-3 group">
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className={`flex items-center gap-3 ${
                scrolled
                  ? "bg-white/95 rounded-xl px-3 py-1.5"
                  : "bg-white/10 backdrop-blur-sm rounded-xl px-3 py-1.5"
              }`}
            >
              <img
                src={ghwLogo}
                alt="Global Health Works"
                className="h-10 md:h-12 w-auto object-contain"
              />
              <span className="font-bold text-sm sm:text-lg md:text-xl tracking-tight text-[var(--color-primary)]">
                Global Health Works
              </span>
            </motion.div>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {/* {!user && (
              <div className="flex items-center gap-1">
                <Link
                  to="/about"
                  className="flex items-center gap-2 px-4 py-2 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] font-medium transition-colors rounded-lg hover:bg-[var(--color-primary)]/5"
                >
                  <Info size={18} />
                  About
                </Link>
                <button
                  onClick={scrollToHowItWorks}
                  className="flex items-center gap-2 px-4 py-2 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] font-medium transition-colors rounded-lg hover:bg-[var(--color-primary)]/5"
                >
                  <HelpCircle size={18} />
                  How It Works
                </button>
              </div>
            )} */}

            {/* <div className="relative group">
              <motion.button
                onClick={toggleTheme}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={`p-2.5 rounded-xl transition-colors ${
                  theme === "dark"
                    ? "bg-slate-800 hover:bg-slate-700 text-gray-200"
                    : "bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/20 text-[var(--color-primary)]"
                }`}
                aria-label="Toggle theme"
              >
              <AnimatePresence mode="wait">
                {theme === "light" ? (
                  <motion.div
                    key="sun"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Moon
                      size={20}
                      className="text-[var(--color-primary)]"
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="moon"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Sun
                      size={20}
                      className="text-[var(--color-accent-light)]"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              </motion.button>
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                {theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
              </div>
            </div> */}

            {!user ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-5 py-2.5 font-semibold transition-colors rounded-xl border text-[var(--color-primary)] border-[var(--color-primary)] hover:bg-[var(--color-primary)]/10">
                  Log in
                </Link>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link to="/signup" className="btn-accent inline-block">
                    Get Started
                  </Link>
                </motion.div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <NotificationBell />

                <div className="relative" ref={userMenuRef}>
                  <motion.button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center gap-2 p-1.5 pr-3 rounded-xl transition-colors bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/20"
                  >
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt={user.firstName}
                        className="w-9 h-9 rounded-lg object-cover ring-2 ring-[var(--color-primary)]/30"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--color-primary-light)] to-[var(--color-primary)] flex items-center justify-center text-white font-semibold text-sm">
                        {user.firstName?.[0]}
                        {user.lastName?.[0]}
                      </div>
                    )}
                    <span className="font-medium hidden lg:block text-[var(--color-primary)]">
                      {user.firstName}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`transition-transform ${userMenuOpen ? "rotate-180" : ""} text-[var(--color-primary)]`}
                    />
                  </motion.button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-56 bg-[var(--color-surface)] rounded-xl shadow-xl border border-[var(--color-border)] py-2 overflow-hidden"
                      >
                        <div className="px-4 py-2 border-b border-[var(--color-border)]">
                          <p className="font-semibold text-[var(--color-text)]">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-sm text-[var(--color-text-secondary)] capitalize">
                            {user.role?.replace(/([A-Z])/g, " $1").trim()}
                          </p>
                        </div>

                        <Link
                          to={getDashboardLink()}
                          className="flex items-center gap-3 px-4 py-2.5 text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)] transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <LayoutDashboard size={18} />
                          Dashboard
                        </Link>

                        <Link
                          to="/profile"
                          className="flex items-center gap-3 px-4 py-2.5 text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)] transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <User size={18} />
                          Profile
                        </Link>

                        <Link
                          to="/settings"
                          className="flex items-center gap-3 px-4 py-2.5 text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)] transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Settings size={18} />
                          Settings
                        </Link>

                        <div className="border-t border-[var(--color-border)] mt-1 pt-1">
                          <button
                            onClick={logout}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <LogOut size={18} />
                            Log Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            {/* <div className="relative group">
              <motion.button
                onClick={toggleTheme}
                whileTap={{ scale: 0.95 }}
                className={`p-2 rounded-lg ${
                  theme === "dark"
                    ? "bg-slate-800 text-gray-200"
                    : "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                }`}
                title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
              >
                {theme === "light" ? (
                  <Moon size={20} className="text-[var(--color-primary)]" />
                ) : (
                  <Sun size={20} className="text-[var(--color-accent-light)]" />
                )}
              </motion.button>
            </div> */}

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-screen  w-80 max-w-[85vw] bg-white shadow-2xl z-50 md:hidden overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <span className="font-bold text-lg text-[var(--color-primary)]">Menu</span>
                  <button
                    onClick={() => setMenuOpen(false)}
                    className="p-2 rounded-lg hover:bg-[var(--color-bg-secondary)] transition-colors"
                  >
                    <X size={24} className="text-[var(--color-text-secondary)]" />
                  </button>
                </div>

                {!user ? (
                  <div className="space-y-4">
                    {/* <div className="space-y-1 mb-6">
                      <Link
                        to="/about"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-white hover:bg-[var(--color-primary)]/10 transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        <Info size={20} className="text-white" />
                        About
                      </Link>
                      <button
                        onClick={scrollToHowItWorks}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-white hover:bg-[var(--color-primary)]/10 transition-colors text-left"
                      >
                        <HelpCircle size={20} className="text-white" />
                        How It Works
                      </button>
                    </div> */}

                    <div className=" space-y-3">
                      <Link
                        to="/login"
                        className="flex items-center justify-center gap-2 px-4 py-3 font-semibold rounded-xl border-2 border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        <User size={18} />
                        Log in
                      </Link>
                      <Link
                        to="/signup"
                        className="flex items-center justify-center gap-2 px-4 py-3 font-semibold rounded-xl bg-gradient-to-r from-[var(--color-accent)] to-[#d45428] text-white hover:shadow-lg transition-all"
                        onClick={() => setMenuOpen(false)}
                      >
                        Get Started
                      </Link>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="px-4 py-4 flex items-center gap-3 bg-[var(--color-primary)]/5 rounded-xl mb-6">
                      {profileImage ? (
                        <img
                          src={profileImage}
                          alt=""
                          className="w-14 h-14 rounded-xl object-cover ring-2 ring-[var(--color-primary)]/30"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[var(--color-primary-light)] to-[var(--color-primary)] flex items-center justify-center text-white font-semibold text-xl">
                          {user.firstName?.[0]}
                          {user.lastName?.[0]}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-[var(--color-text)]">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm capitalize text-[var(--color-text-secondary)]">
                          {user.role?.replace(/([A-Z])/g, " $1").trim()}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Link
                        to={getDashboardLink()}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--color-text)] hover:bg-[var(--color-primary)]/10 transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        <LayoutDashboard size={20} className="text-[var(--color-primary)]" /> Dashboard
                      </Link>

                      <Link
                        to="/profile"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--color-text)] hover:bg-[var(--color-primary)]/10 transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        <User size={20} className="text-[var(--color-primary)]" /> Profile
                      </Link>

                      <Link
                        to="/settings"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--color-text)] hover:bg-[var(--color-primary)]/10 transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        <Settings size={20} className="text-[var(--color-primary)]" /> Settings
                      </Link>

                      <Link
                        to="/notifications"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--color-text)] hover:bg-[var(--color-primary)]/10 transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        <Bell size={20} className="text-[var(--color-primary)]" /> Notifications
                      </Link>
                    </div>

                    <div className="border-t border-[var(--color-border)] mt-6 pt-4">
                      <button
                        onClick={() => {
                          logout();
                          setMenuOpen(false);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <LogOut size={20} /> Log Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
