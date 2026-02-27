import { Menu, Bell, Search, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';

export default function Navbar({ onMenuClick, title = 'Dashboard' }) {
  const { user } = useAuth();
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-8 py-4
                 bg-dark-900/60 backdrop-blur-xl border-b border-white/[0.04]"
    >
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-xl hover:bg-white/5 text-white/60 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="text-xs text-white/40 hidden sm:block">Welcome back{user?.name ? `, ${user.name}` : ''}!</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2
                        focus-within:border-accent/30 focus-within:bg-white/[0.06] transition-all duration-300">
          <Search className="w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent text-sm text-white placeholder-white/30 outline-none w-40 focus:w-56 transition-all duration-300"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2.5 rounded-xl hover:bg-white/5 text-white/50 hover:text-white transition-all duration-200 group">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full group-hover:animate-ping" />
        </button>

        {/* Avatar */}
        <div className="flex items-center gap-3 ml-2 pl-4 border-l border-white/[0.06]">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent-blue flex items-center justify-center
                          shadow-[0_0_12px_rgba(139,92,246,0.3)] hover:shadow-[0_0_20px_rgba(139,92,246,0.4)]
                          transition-shadow duration-300 cursor-pointer">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-medium text-white/90">{user?.name || 'User'}</p>
            <p className="text-xs text-white/40">{user?.plan || 'Free'}</p>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
