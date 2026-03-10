import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ArrowLeftRight,
  BarChart3,
  Brain,
  Wallet,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
  TrendingUp,
  Grid3X3,
  PiggyBank,
  MessageSquare,
  Bell,
  Users,
  LineChart,
  Target,
  Rss,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/advanced-analytics', icon: LineChart, label: 'Deep Analytics' },
  { to: '/predictions', icon: TrendingUp, label: 'Predictions' },
  { to: '/heatmaps', icon: Grid3X3, label: 'Heatmaps' },
  { to: '/insights', icon: Brain, label: 'AI Insights' },
  { to: '/feed', icon: Rss, label: 'Feed' },
  { to: '/chat', icon: MessageSquare, label: 'AI Chat' },
  { to: '/budgets', icon: Wallet, label: 'Budgets' },
  { to: '/smart-budgets', icon: PiggyBank, label: 'Smart Budgets' },
  { to: '/collaborative', icon: Users, label: 'Collaborative' },
  { to: '/investments', icon: LineChart, label: 'Investments' },
  { to: '/goals', icon: Target, label: 'Goals' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const sidebarContent = (isMobile = false) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-white/[0.06]">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent-blue flex items-center justify-center shadow-glow flex-shrink-0">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <AnimatePresence>
          {(!collapsed || isMobile) && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden whitespace-nowrap"
            >
              <h1 className="text-lg font-bold text-white">
                Divvy <span className="text-accent-light">AI</span>
              </h1>
            </motion.div>
          )}
        </AnimatePresence>
        {isMobile && (
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto p-1.5 rounded-lg hover:bg-white/5 text-white/60"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => isMobile && setMobileOpen(false)}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
              ${
                isActive
                  ? 'bg-accent/10 text-accent-light border border-accent/20 shadow-[0_0_12px_rgba(139,92,246,0.1)]'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04] border border-transparent'
              }`
            }
          >
            <item.icon
              className={`w-5 h-5 flex-shrink-0 transition-all duration-200 group-hover:drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]`}
            />
            <AnimatePresence>
              {(!collapsed || isMobile) && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/[0.06]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium
                     text-white/40 hover:text-red-400 hover:bg-red-500/5 transition-all duration-200
                     border border-transparent hover:border-red-500/10"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <AnimatePresence>
            {(!collapsed || isMobile) && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden whitespace-nowrap"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 z-40
                   bg-dark-900/80 backdrop-blur-xl border-r border-white/[0.06]"
      >
        {sidebarContent(false)}
        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-dark-600 border border-white/10
                     flex items-center justify-center text-white/60 hover:text-white hover:bg-dark-500
                     transition-all duration-200 hover:scale-110"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </motion.aside>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="md:hidden fixed left-0 top-0 bottom-0 z-50 w-[260px]
                         bg-dark-900/95 backdrop-blur-xl border-r border-white/[0.06]"
            >
              {sidebarContent(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
