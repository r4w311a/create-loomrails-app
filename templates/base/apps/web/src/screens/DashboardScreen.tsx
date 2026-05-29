import { useAuth } from '../stores/useAuth';

export function DashboardScreen() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <nav className="flex justify-between items-center px-8 py-5 bg-white border-b border-slate-200">
        <div className="text-xl font-bold text-indigo-600 tracking-tight">LoomRails</div>
        <button
          onClick={() => logout()}
          className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-4 py-2 rounded-lg border border-slate-300 font-medium transition-all"
        >
          Sign out
        </button>
      </nav>

      <main className="max-w-4xl mx-auto px-8 py-16">
        <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-200">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-2">Welcome, {user?.email}</h1>
          <p className="text-lg text-slate-500 mb-10">
            You have successfully authenticated via a secure HttpOnly cookie.
          </p>

          <div className="flex gap-6">
            <div className="flex-1 bg-slate-50 border border-slate-200 p-6 rounded-xl">
              <span className="block text-2xl font-bold text-indigo-600 mb-1">JWT</span>
              <span className="text-sm font-medium text-slate-500">Secure Strategy</span>
            </div>
            <div className="flex-1 bg-slate-50 border border-slate-200 p-6 rounded-xl">
              <span className="block text-2xl font-bold text-indigo-600 mb-1">Cookie</span>
              <span className="text-sm font-medium text-slate-500">Delivery Method</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
