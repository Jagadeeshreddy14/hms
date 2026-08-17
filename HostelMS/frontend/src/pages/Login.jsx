import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Building2, Loader2, User } from 'lucide-react';
import { signInWithGooglePopup } from '../config/firebase';

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', name: '', phone: '', confirmPassword: '', role: 'student' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const res = await signInWithGooglePopup();
      if (!res.success) {
        toast.error(res.error || 'Google login failed');
        return;
      }
      const user = await loginWithGoogle({
        email: res.user.email,
        name: res.user.name,
        avatar: res.user.photoURL,
        googleId: res.user.uid,
      });
      toast.success(`Welcome, ${user.name}!`);
      // Full automatic reload into role dashboard
      window.location.href = `/${user.role}`;
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Google authentication failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      // Full automatic reload into role dashboard
      window.location.href = `/${user.role}`;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authAPI.register({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        role: form.role
      });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      toast.success('Account created successfully!');
      window.location.href = `/${data.user.role}`;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignup(!isSignup);
    setForm({ email: '', password: '', name: '', phone: '', confirmPassword: '', role: 'warden' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary-900 to-slate-900 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)`,
        backgroundSize: '20px 20px'
      }} />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-2xl mb-4 shadow-lg shadow-primary-500/30">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">HostelMS</h1>
          <p className="text-slate-400 mt-1 text-sm">Smart Hostel Management Platform</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-6">
            {isSignup ? 'Create your account' : 'Sign in to your account'}
          </h2>

          <form onSubmit={isSignup ? handleSignupSubmit : handleLoginSubmit} className="space-y-4">
            {isSignup && (
              <>
                {/* Student Registration Option */}
                <div className="mb-6 p-4 border border-emerald-500/30 bg-emerald-500/5 rounded-lg">
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-slate-300 font-medium mb-2">Are you a student?</p>
                      <p className="text-xs text-slate-400 mb-3">Student registration requires admin/warden approval. Complete your profile with documents to get started.</p>
                      <Link
                        to="/student-registration"
                        className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
                      >
                        Register as Student
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-slate-900/50 text-slate-400">or create staff account</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition"
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition"
                    placeholder="+91 9876543210"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Role</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition"
                  >
                    <option value="warden" className="bg-slate-900">Warden</option>
                    <option value="admin" className="bg-slate-900">Admin</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-white/10 border border-white/15 rounded-xl px-4 py-3 pr-12 text-white placeholder-slate-500 focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition"
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
                >
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {isSignup && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirm Password</label>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className="w-full bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition"
                  placeholder="Confirm password"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full bg-primary-600 hover:bg-primary-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-primary-600/30"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? (isSignup ? 'Creating account...' : 'Signing in...') : (isSignup ? 'Create Account' : 'Sign In')}
            </button>

            {/* Google 1-Click Sign-In */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-900/90 px-3 text-slate-400 font-medium">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading || loading}
              className="w-full py-3 px-4 bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl text-white font-medium text-sm transition-all duration-200 flex items-center justify-center gap-3 shadow-md hover:border-white/25"
            >
              {googleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              )}
              {googleLoading ? 'Signing in with Google...' : 'Sign in with Google'}
            </button>
          </form>

          {/* Toggle signup/login */}
          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-sm text-slate-400">
              {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                onClick={toggleMode}
                className="text-primary-400 hover:text-primary-300 font-semibold transition"
              >
                {isSignup ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
