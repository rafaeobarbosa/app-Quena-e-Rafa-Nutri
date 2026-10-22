import { useState, useEffect } from 'react';
import { auth, useSession } from '@/lib/auth';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { Leaf, Gamepad2 } from 'lucide-react';
import { CakeWarfareApp } from './game/CakeWarfareApp';

export function App() {
  const session = useSession();
  const [view, setView] = useState<'game' | 'login' | 'register'>('login');

  // Listen to cross-tab updates or manual state changes
  useEffect(() => {
    // If user is already authenticated, maintain dashboard view
  }, [session.data]);

  const handleSignOut = async () => {
    await auth.signOut();
  };

  // Loading state while checking persistent session
  if (session.isPending) {
    return (
      <div className="min-h-screen bg-[#f3faf9] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-teal-600 to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-teal-600/30 animate-pulse">
            <Leaf className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-teal-950">Nutri Help</h2>
            <p className="text-sm text-teal-700/70 mt-1">Verificando sessão segura...</p>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'game') {
    return (
      <div className="relative w-screen h-screen">
        <div className="absolute top-4 left-4 z-50">
          <button
            onClick={() => setView('login')}
            className="flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white text-slate-800 rounded-full font-bold shadow-lg border border-slate-200 text-xs backdrop-blur-md transition-all hover:scale-105 active:scale-95"
          >
            <Leaf className="w-4 h-4 text-teal-600" />
            Nutri Help (Painel)
          </button>
        </div>
        <CakeWarfareApp />
      </div>
    );
  }

  // Regra do prompt 2:
  // - Após o login bem sucedido, redirecionar para o dashboard
  // - Manter a sessão ativa para que ele(a) não precise fazer login toda vez que abrir o sistema
  // - Se já estiver logado(a) e tentar acessar a tela de login, redirecionar direto para o dashboard
  if (session.data?.user) {
    return (
      <Dashboard
        user={session.data.user}
        onSignOut={handleSignOut}
      />
    );
  }

  // Auth screen (Login / Register)
  return (
    <div className="min-h-screen bg-[#f3faf9] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={() => setView('game')}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full font-bold shadow-lg text-xs transition-all hover:scale-105 active:scale-95"
        >
          <Gamepad2 className="w-4 h-4" />
          Jogar Cake Warfare 3D
        </button>
      </div>
      {/* Background aesthetic decorative shapes */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-teal-100/50 via-teal-50/20 to-transparent pointer-events-none -z-10 rounded-b-full blur-2xl" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl pointer-events-none -z-10" />

      {view === 'login' ? (
        <LoginForm
          onNavigateToRegister={() => setView('register')}
          onSuccess={() => {
            // Neon Auth will update useSession() automatically
          }}
        />
      ) : (
        <RegisterForm
          onNavigateToLogin={() => setView('login')}
          onSuccess={() => {
            // Neon Auth automatically logs in or updates session
          }}
        />
      )}

      {/* Footer copyright */}
      <div className="mt-8 text-center text-xs text-teal-700/50">
        © {new Date().getFullYear()} Nutri Help • Sistema de Gestão Nutricional Integrado
      </div>
    </div>
  );
}

export default App;
