import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/transactions': 'Transactions',
  '/analytics': 'Analytics',
  '/advanced-analytics': 'Deep Analytics',
  '/predictions': 'AI Predictions',
  '/heatmaps': 'Spending Heatmaps',
  '/insights': 'AI Insights',
  '/feed': 'Your Feed',
  '/chat': 'AI Chat',
  '/budgets': 'Budgets',
  '/smart-budgets': 'Smart Budgets',
  '/collaborative': 'Collaborative Budgets',
  '/investments': 'Investments',
  '/goals': 'Goals',
  '/notifications': 'Notifications',
  '/settings': 'Settings',
};

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'Dashboard';

  return (
    <div className="min-h-screen bg-dark-950">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <motion.div
        animate={{ marginLeft: collapsed ? 72 : 240 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="min-h-screen flex flex-col md:ml-0"
        style={{ marginLeft: 0 }}
      >
        {/* On desktop, respect sidebar width */}
        <div className="hidden md:block" />
        <motion.div
          animate={{ marginLeft: collapsed ? 72 : 240 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="hidden md:flex flex-col min-h-screen"
        >
          <Navbar onMenuClick={() => setMobileOpen(true)} title={title} />
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <AnimatePresence mode="wait">
              <Outlet key={location.pathname} />
            </AnimatePresence>
          </main>
        </motion.div>

        {/* Mobile: no margin */}
        <div className="md:hidden flex flex-col min-h-screen">
          <Navbar onMenuClick={() => setMobileOpen(true)} title={title} />
          <main className="flex-1 p-4">
            <AnimatePresence mode="wait">
              <Outlet key={location.pathname} />
            </AnimatePresence>
          </main>
        </div>
      </motion.div>
    </div>
  );
}
