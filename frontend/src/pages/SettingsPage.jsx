import { motion } from 'framer-motion';
import { User, Bell, Shield, Palette, CreditCard, Globe, Moon, ChevronRight } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import PageTransition from '../components/PageTransition';
import { useAuth } from '../hooks/useAuth';

const sections = [
  {
    title: 'Account',
    items: [
      { icon: User, label: 'Profile Settings', desc: 'Update your name, email, and avatar' },
      { icon: Shield, label: 'Security', desc: 'Password, 2FA, and login sessions' },
      { icon: CreditCard, label: 'Billing & Plan', desc: 'Manage subscription and payment methods' },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { icon: Bell, label: 'Notifications', desc: 'Email, push, and in-app alerts' },
      { icon: Palette, label: 'Appearance', desc: 'Theme, colors, and display settings' },
      { icon: Globe, label: 'Language & Region', desc: 'Currency, date format, and language' },
    ],
  },
];

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <PageTransition>
      <div className="max-w-3xl space-y-8">
        {/* Profile Card */}
        <GlassCard hover={false} delay={0} className="p-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent-blue flex items-center justify-center shadow-glow text-xl font-bold text-white">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">{user?.name || 'User'}</h3>
              <p className="text-sm text-white/40">{user?.email || ''}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-accent/10 text-accent-light border border-accent/20">
                  {user?.plan || 'Free'} Plan
                </span>
                <span className="text-[10px] text-white/25">Member since {user?.member_since || 'N/A'}</span>
              </div>
            </div>
            <button className="btn-secondary text-xs !px-4 !py-2">Edit Profile</button>
          </div>
        </GlassCard>

        {/* Settings Sections */}
        {sections.map((section, si) => (
          <div key={section.title}>
            <h3 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3 px-1">{section.title}</h3>
            <GlassCard hover={false} delay={0.1 + si * 0.15} className="divide-y divide-white/[0.04]">
              {section.items.map((item, i) => (
                <motion.button
                  key={item.label}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors text-left group"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/[0.03] flex items-center justify-center group-hover:bg-white/[0.06] transition-colors">
                    <item.icon className="w-5 h-5 text-white/35 group-hover:text-white/60 transition-colors" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white/80">{item.label}</p>
                    <p className="text-xs text-white/30">{item.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/15 group-hover:text-white/40 group-hover:translate-x-0.5 transition-all" />
                </motion.button>
              ))}
            </GlassCard>
          </div>
        ))}

        {/* Dark Mode Toggle */}
        <GlassCard hover={false} delay={0.5} className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Moon className="w-5 h-5 text-white/40" />
              <div>
                <p className="text-sm font-medium text-white/80">Dark Mode</p>
                <p className="text-xs text-white/30">Always dark, always beautiful</p>
              </div>
            </div>
            <div className="w-11 h-6 bg-accent/30 rounded-full relative cursor-pointer">
              <div className="absolute right-0.5 top-0.5 w-5 h-5 bg-accent rounded-full shadow-glow" />
            </div>
          </div>
        </GlassCard>
      </div>
    </PageTransition>
  );
}
