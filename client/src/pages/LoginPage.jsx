import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Eye, EyeOff, ArrowRight, Sparkles, Sun, Moon } from 'lucide-react';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', role: 'employee'
  });

  const { login, register } = useAuth();
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await login(form.email, form.password);
      } else {
        await register({ firstName: form.firstName, lastName: form.lastName, email: form.email, password: form.password, role: form.role });
      }
      toast.success(isLogin ? 'Welcome back!' : 'Account created!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen flex bg-surface-50 dark:bg-surface-950 transition-colors">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700" />
        <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px)', backgroundSize: '50px 50px'}} />
        
        {/* Floating orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-accent-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary-400/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
        
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">WorkForce Intelligence</h2>
              <p className="text-sm text-white/60">AI-Powered Management</p>
            </div>
          </div>
          
          <h1 className="text-5xl font-bold leading-tight mb-6">
            Manage your<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-300 to-pink-300">
              entire workforce
            </span><br />
            intelligently.
          </h1>
          
          <p className="text-lg text-white/70 max-w-md leading-relaxed">
            From project tracking to AI-powered insights, everything your team needs in one centralized platform.
          </p>

          <div className="mt-12 flex gap-8">
            {[
              { num: '10K+', label: 'Active Users' },
              { num: '99.9%', label: 'Uptime' },
              { num: '50+', label: 'Integrations' }
            ].map((stat, i) => (
              <div key={i}>
                <p className="text-2xl font-bold">{stat.num}</p>
                <p className="text-sm text-white/50">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        <button onClick={toggle} className="absolute top-6 right-6 p-2 rounded-xl text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800">
          {isDark ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} />}
        </button>

        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <span className="text-white font-bold">WI</span>
            </div>
            <h2 className="text-lg font-bold text-surface-900 dark:text-white">WorkForce Intelligence</h2>
          </div>

          <h3 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">
            {isLogin ? 'Welcome back' : 'Create account'}
          </h3>
          <p className="text-surface-400 mb-8">
            {isLogin ? 'Enter your credentials to access your workspace' : 'Start managing your team with AI power'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="flex gap-3 animate-slide-up">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">First Name</label>
                  <input name="firstName" value={form.firstName} onChange={handleChange} className="input-field" placeholder="John" required />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Last Name</label>
                  <input name="lastName" value={form.lastName} onChange={handleChange} className="input-field" placeholder="Doe" required />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} className="input-field" placeholder="you@company.com" required />
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Password</label>
              <input type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} className="input-field pr-10" placeholder="••••••••" required minLength={6} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-[38px] text-surface-400">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 mt-2">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>{isLogin ? 'Sign In' : 'Create Account'} <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          {isLogin && (
            <div className="mt-6 p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800/30">
              <p className="text-xs font-semibold text-primary-700 dark:text-primary-300 mb-2">Demo Credentials</p>
              <div className="space-y-1 text-xs text-primary-600 dark:text-primary-400">
                <p><span className="font-medium">Admin:</span> admin@workforce.com</p>
                <p><span className="font-medium">HR:</span> sarah@workforce.com</p>
                <p><span className="font-medium">Password:</span> password123</p>
              </div>
            </div>
          )}

          <p className="mt-6 text-center text-sm text-surface-400">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            <button onClick={() => setIsLogin(!isLogin)} className="ml-1.5 font-semibold text-primary-600 dark:text-primary-400 hover:underline">
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
