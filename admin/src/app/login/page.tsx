// admin/src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Building2, Shield, Users, Truck } from 'lucide-react';

type LoginMode = 'platform' | 'tenant';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginMode, setLoginMode] = useState<LoginMode>('platform');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { loginPlatformAdmin, loginMultiTenant } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (loginMode === 'platform') {
        await loginPlatformAdmin(email, password);
      } else {
        // Multi-tenant login - automatically finds all restaurants for this user
        await loginMultiTenant(email, password);
      }
    } catch (err: any) {
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        setError('Cannot connect to server. Please make sure the backend is running.');
      } else {
        setError(err.message || 'Invalid credentials');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 mb-4">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">DeliveryApp</h1>
          <p className="text-slate-400">Sign in to continue</p>
        </div>

        {/* Login Mode Tabs */}
        <div className="flex bg-slate-800/50 rounded-xl p-1 mb-6">
          <button
            type="button"
            onClick={() => setLoginMode('platform')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              loginMode === 'platform'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="h-4 w-4" />
            Platform Admin
          </button>
          <button
            type="button"
            onClick={() => setLoginMode('tenant')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              loginMode === 'tenant'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="h-4 w-4" />
            Restaurant User
          </button>
        </div>

        {/* Login Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/10">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Info for tenant login */}
            {loginMode === 'tenant' && (
              <div className="p-3 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-200 text-sm">
                <p>Enter your credentials. You'll automatically have access to all your restaurants.</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/30"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Help Text */}
          <div className="mt-6 pt-4 border-t border-slate-700/50">
            <p className="text-xs text-slate-400 text-center">
              {loginMode === 'platform' ? (
                <>
                  <strong>Platform Admins:</strong> superadmin@platform.com / SuperAdmin123!
                </>
              ) : (
                <>
                  <strong>Restaurant Owner:</strong> owner@example.com / OwnerPass123!
                </>
              )}
            </p>
          </div>
        </div>

        {/* User Type Info */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <Shield className="h-5 w-5 text-amber-400 mx-auto mb-1" />
            <p className="text-xs text-slate-400">Platform Admin</p>
            <p className="text-xs text-slate-500">Manage all restaurants</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <Building2 className="h-5 w-5 text-indigo-400 mx-auto mb-1" />
            <p className="text-xs text-slate-400">Restaurant Owner</p>
            <p className="text-xs text-slate-500">Manage your restaurant</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <Users className="h-5 w-5 text-emerald-400 mx-auto mb-1" />
            <p className="text-xs text-slate-400">Customer</p>
            <p className="text-xs text-slate-500">Order food</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <Truck className="h-5 w-5 text-blue-400 mx-auto mb-1" />
            <p className="text-xs text-slate-400">Delivery Agent</p>
            <p className="text-xs text-slate-500">Deliver orders</p>
          </div>
        </div>
      </div>
    </div>
  );
}