import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Brain,
  Bell,
  TrendingUp,
  Tag,
  ArrowRight,
  BarChart3,
  Shield,
  ChevronRight,
  Github,
  Twitter,
  Linkedin,
} from 'lucide-react';

const fadeUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.7, ease: 'easeOut' },
};

const stagger = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

const features = [
  {
    icon: Brain,
    title: 'AI Spending Analysis',
    desc: 'Deep learning models analyze your spending patterns and provide personalized insights.',
  },
  {
    icon: Bell,
    title: 'Smart Budget Alerts',
    desc: 'Intelligent notifications that warn you before you overspend in any category.',
  },
  {
    icon: TrendingUp,
    title: 'Predictive Forecasting',
    desc: 'ML-powered expense prediction helps you plan finances months in advance.',
  },
  {
    icon: Tag,
    title: 'Auto Categorization',
    desc: 'AI automatically categorizes transactions with 98% accuracy. No manual tagging.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-dark-950 overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-accent/[0.07] rounded-full blur-[128px] animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent-blue/[0.05] rounded-full blur-[128px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent-cyan/[0.03] rounded-full blur-[128px]" />
      </div>

      {/* Navbar */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex items-center justify-between px-6 md:px-12 lg:px-20 py-5"
      >
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent-blue flex items-center justify-center shadow-glow">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">
            Divvy <span className="text-accent-light">AI</span>
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm text-white/50">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#preview" className="hover:text-white transition-colors">Preview</a>
          <a href="#" className="hover:text-white transition-colors">Pricing</a>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm text-white/60 hover:text-white transition-colors px-4 py-2">
            Log in
          </Link>
          <Link to="/signup" className="btn-primary text-sm !px-5 !py-2.5">
            Get Started
          </Link>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-20 md:pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent-light text-xs font-medium mb-8"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Powered by Advanced AI
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight max-w-4xl"
        >
          AI That Understands{' '}
          <span className="text-gradient">Your Money.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-6 text-lg md:text-xl text-white/40 max-w-xl leading-relaxed"
        >
          Smart insights. Smarter spending. Let AI take control of your finances so you can focus on what matters.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.7 }}
          className="flex flex-col sm:flex-row items-center gap-4 mt-10"
        >
          <Link to="/signup" className="btn-primary flex items-center gap-2 text-base !px-8 !py-4">
            Get Started Free
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/dashboard" className="btn-secondary flex items-center gap-2 text-base !px-8 !py-4">
            View Demo
            <ChevronRight className="w-4 h-4" />
          </Link>
        </motion.div>

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.9 }}
          className="flex flex-wrap justify-center gap-8 md:gap-16 mt-16"
        >
          {[
            ['50K+', 'Active Users'],
            ['₹2Cr+', 'Tracked Monthly'],
            ['98%', 'Accuracy'],
            ['4.9★', 'User Rating'],
          ].map(([val, label]) => (
            <div key={label} className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-gradient">{val}</p>
              <p className="text-xs text-white/30 mt-1">{label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Dashboard Preview */}
      <section id="preview" className="relative z-10 px-6 md:px-12 lg:px-20 pb-24">
        <motion.div
          {...fadeUp}
          className="max-w-5xl mx-auto rounded-2xl border border-white/[0.08] overflow-hidden relative"
          style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.05), rgba(99,102,241,0.03), rgba(34,211,238,0.02))',
            boxShadow: '0 20px 80px rgba(139,92,246,0.15), 0 0 0 1px rgba(139,92,246,0.1)',
          }}
        >
          <div className="p-1">
            <div className="rounded-xl bg-dark-900/80 p-6 md:p-8">
              {/* Mock dashboard header */}
              <div className="flex items-center gap-2 mb-6">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
                <span className="text-xs text-white/20 ml-3">divvy.ai/dashboard</span>
              </div>
              {/* Mock cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                  { label: 'Balance', value: '₹2,45,890', color: 'from-violet-500/20 to-purple-600/10' },
                  { label: 'Spending', value: '₹48,320', color: 'from-blue-500/20 to-indigo-600/10' },
                  { label: 'Savings', value: '34.2%', color: 'from-emerald-500/20 to-teal-600/10' },
                  { label: 'AI Score', value: '72/100', color: 'from-amber-500/20 to-orange-600/10' },
                ].map((card) => (
                  <div
                    key={card.label}
                    className={`bg-gradient-to-br ${card.color} border border-white/[0.06] rounded-xl p-4`}
                  >
                    <p className="text-xs text-white/40 mb-1">{card.label}</p>
                    <p className="text-lg font-bold text-white">{card.value}</p>
                  </div>
                ))}
              </div>
              {/* Mock chart area */}
              <div className="h-48 bg-white/[0.02] rounded-xl border border-white/[0.04] flex items-center justify-center">
                <div className="flex items-end gap-2 h-24">
                  {[40, 65, 50, 80, 60, 75, 55].map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      whileInView={{ height: `${h}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: i * 0.1 }}
                      className="w-6 md:w-8 rounded-t-md bg-gradient-to-t from-accent/40 to-accent-blue/60"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 px-6 md:px-12 lg:px-20 py-24">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-16">
            <span className="text-accent text-sm font-semibold uppercase tracking-wider">Features</span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mt-4">
              Everything you need to{' '}
              <span className="text-gradient">master your money</span>
            </h2>
            <p className="text-white/40 mt-4 max-w-2xl mx-auto">
              Our AI engine processes thousands of data points to deliver real-time insights and predictions.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-5">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                {...stagger}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="glass-card-hover p-8 group"
              >
                <div
                  className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-5
                             group-hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all duration-300"
                >
                  <feature.icon className="w-6 h-6 text-accent-light" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 md:px-12 lg:px-20 py-24">
        <motion.div
          {...fadeUp}
          className="max-w-4xl mx-auto text-center glass-card p-12 md:p-16"
          style={{
            boxShadow: '0 0 60px rgba(139,92,246,0.1), inset 0 1px 0 0 rgba(255,255,255,0.05)',
          }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to take control?
          </h2>
          <p className="text-white/40 mb-8 max-w-lg mx-auto">
            Join 50,000+ users who already trust Divvy AI with their financial future.
          </p>
          <Link to="/signup" className="btn-primary inline-flex items-center gap-2 text-base !px-10 !py-4">
            Start Free Trial
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.04] px-6 md:px-12 lg:px-20 py-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-blue flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-white/60">
              Divvy <span className="text-accent-light/60">AI</span>
            </span>
          </div>
          <p className="text-xs text-white/20">© 2026 Divvy AI. All rights reserved.</p>
          <div className="flex items-center gap-4">
            {[Twitter, Github, Linkedin].map((Icon, i) => (
              <a key={i} href="#" className="p-2 rounded-lg hover:bg-white/5 text-white/30 hover:text-white/60 transition-colors">
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
