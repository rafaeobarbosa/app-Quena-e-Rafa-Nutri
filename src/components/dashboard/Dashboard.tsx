import React, { useEffect, useState, useCallback } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  LogOut, 
  Calendar, 
  UserCheck, 
  AlertCircle, 
  ArrowRight, 
  RefreshCw,
  Sparkles,
  ChevronRight,
  Clock
} from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { PacientesView, PacienteCompleto } from '@/components/pacientes/PacientesView';
import { sql } from '@/lib/db';

interface DashboardProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
  onSignOut: () => Promise<void>;
}

export interface PacienteSemRetorno {
  id: string;
  nome: string;
  ultima_consulta: string;
  dias_sem_consulta: number;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onSignOut }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pacientes'>('dashboard');
  const [selectedPacienteId, setSelectedPacienteId] = useState<string | null>(null);
  const [pacientesSubView, setPacientesSubView] = useState<'list' | 'new'>('list');
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Estados dos dados em tempo real carregados do Neon
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [totalPacientes, setTotalPacientes] = useState<number>(0);
  const [consultasSemana, setConsultasSemana] = useState<number>(0);
  const [pacientesSemRetorno, setPacientesSemRetorno] = useState<PacienteSemRetorno[]>([]);
  const [listaPacientes, setListaPacientes] = useState<PacienteCompleto[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      // 1. Total de pacientes ativos cadastrados pela nutricionista logada
      const totalPacientesRes = await sql`
        SELECT COUNT(*)::int as total
        FROM public.pacientes
        WHERE nutricionista_id = ${user.id}::uuid
      `;
      const totalCount = Number(totalPacientesRes[0]?.total || 0);
      setTotalPacientes(totalCount);

      // 2. Consultas da semana atual da nutricionista logada
      // A semana vai de segunda a domingo (date_trunc('week', now()))
      const consultasSemanaRes = await sql`
        SELECT COUNT(c.id)::int as total
        FROM public.consultas c
        INNER JOIN public.pacientes p ON p.id = c.paciente_id
        WHERE p.nutricionista_id = ${user.id}::uuid
          AND c.data_consulta >= date_trunc('week', CURRENT_DATE)::date
          AND c.data_consulta < (date_trunc('week', CURRENT_DATE) + interval '7 days')::date
      `;
      const consultasCount = Number(consultasSemanaRes[0]?.total || 0);
      setConsultasSemana(consultasCount);

      // 3. Pacientes sem retorno
      // Cuja última consulta foi há mais de 30 dias E não possuem próximo retorno agendado (ou proximo_retorno é nulo ou menor/igual à data atual)
      const semRetornoRes = await sql`
        WITH ultimas_consultas AS (
          SELECT 
            c.paciente_id,
            MAX(c.data_consulta) as ultima_data,
            MAX(c.proximo_retorno) as proximo_agendado
          FROM public.consultas c
          INNER JOIN public.pacientes p ON p.id = c.paciente_id
          WHERE p.nutricionista_id = ${user.id}::uuid
          GROUP BY c.paciente_id
        )
        SELECT 
          p.id,
          p.nome,
          uc.ultima_data::text as ultima_consulta,
          (CURRENT_DATE - uc.ultima_data)::int as dias_sem_consulta
        FROM ultimas_consultas uc
        INNER JOIN public.pacientes p ON p.id = uc.paciente_id
        WHERE uc.ultima_data < (CURRENT_DATE - interval '30 days')::date
          AND (uc.proximo_agendado IS NULL OR uc.proximo_agendado <= CURRENT_DATE)
        ORDER BY uc.ultima_data ASC
      `;
      
      const semRetornoList: PacienteSemRetorno[] = semRetornoRes.map(row => ({
        id: String(row.id),
        nome: String(row.nome),
        ultima_consulta: String(row.ultima_consulta),
        dias_sem_consulta: Number(row.dias_sem_consulta || 0)
      }));
      setPacientesSemRetorno(semRetornoList);

      // 4. Lista geral de pacientes para navegação completa com última consulta
      const todosPacientesRes = await sql`
        SELECT 
          p.id,
          p.nutricionista_id,
          p.nome,
          p.data_nascimento::text as data_nascimento,
          p.sexo,
          p.telefone,
          p.whatsapp,
          p.email,
          p.peso_inicial,
          p.altura,
          p.objetivos,
          p.objetivo_texto,
          p.nivel_atividade,
          p.patologias,
          p.restricoes_alimentares,
          p.alergias,
          p.medicamentos,
          p.suplementos,
          p.refeicoes_por_dia,
          p.horario_acorda,
          p.horario_dorme,
          p.litros_agua,
          p.atividade_fisica,
          p.atividade_fisica_descricao,
          p.observacoes,
          p.created_at::text as created_at,
          (
            SELECT MAX(c.data_consulta)::text 
            FROM public.consultas c 
            WHERE c.paciente_id = p.id
          ) as ultima_consulta
        FROM public.pacientes p
        WHERE p.nutricionista_id = ${user.id}::uuid
        ORDER BY p.nome ASC
      `;
      setListaPacientes(todosPacientesRes as PacienteCompleto[]);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Erro ao sincronizar dados em tempo real com o Neon:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await onSignOut();
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleNavigateToPatient = (pacienteId: string) => {
    setSelectedPacienteId(pacienteId);
    setPacientesSubView('list');
    setActiveTab('pacientes');
  };

  return (
    <div className="min-h-screen bg-[#f3faf9] flex flex-col md:flex-row font-sans text-teal-950">
      {/* Menu Lateral Fixo */}
      <aside className="w-full md:w-64 bg-white border-r border-teal-100 flex flex-col shrink-0 md:h-screen md:sticky md:top-0 shadow-sm z-30">
        {/* Topo do Menu com Logo Nutri APP */}
        <div className="p-6 border-b border-teal-50 flex items-center justify-between">
          <Logo size="md" appName="Nutri APP" subtitle="Gestão Nutricional" />
        </div>

        {/* Links de Navegação */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <button
            onClick={() => {
              setActiveTab('dashboard');
              setSelectedPacienteId(null);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-700/20'
                : 'text-teal-800 hover:bg-teal-50/80 hover:text-teal-950'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 shrink-0" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('pacientes');
              setSelectedPacienteId(null);
              setPacientesSubView('list');
            }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'pacientes'
                ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-700/20'
                : 'text-teal-800 hover:bg-teal-50/80 hover:text-teal-950'
            }`}
          >
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 shrink-0" />
              <span>Pacientes</span>
            </div>
            {totalPacientes > 0 && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'pacientes'
                  ? 'bg-white/20 text-white'
                  : 'bg-teal-100 text-teal-800'
              }`}>
                {totalPacientes}
              </span>
            )}
          </button>
        </nav>

        {/* Rodapé do Menu com Dados do Usuário e Sair */}
        <div className="p-4 border-t border-teal-50 bg-teal-50/30">
          <div className="flex items-center gap-3 mb-3 p-2 rounded-xl bg-white/70 border border-teal-100/60">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-400 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
              {(user.name || user.email || 'N').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-teal-950 truncate">
                {user.name || 'Nutricionista'}
              </p>
              <p className="text-[11px] text-teal-600/70 truncate">
                {user.email}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            isLoading={isSigningOut}
            className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-teal-800 border-teal-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair do Sistema</span>
          </Button>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Header Superior */}
        <header className="bg-white/80 backdrop-blur-md border-b border-teal-100/70 px-6 sm:px-10 py-5 sticky top-0 z-20 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-teal-950">
              {activeTab === 'dashboard' 
                ? 'Painel Geral' 
                : selectedPacienteId 
                  ? 'Perfil do Paciente'
                  : pacientesSubView === 'new' 
                    ? 'Novo Paciente' 
                    : 'Gestão de Pacientes'}
            </h2>
            <p className="text-xs text-teal-600/80 flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Neon Serverless Conectado • Tempo Real
              {lastUpdated && (
                <span className="text-teal-500 hidden sm:inline">
                  • Atualizado às {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchDashboardData(true)}
              isLoading={isRefreshing}
              className="border-teal-200 text-teal-800 hover:bg-teal-50 text-xs flex items-center gap-1.5 rounded-xl cursor-pointer"
              title="Atualizar dados agora"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
          </div>
        </header>

        {/* Área de Visualização */}
        <div className="p-6 sm:p-10 space-y-8 flex-1">
          {activeTab === 'pacientes' ? (
            <PacientesView
              pacientes={listaPacientes}
              selectedPacienteId={selectedPacienteId}
              currentSubView={pacientesSubView}
              nutricionistaId={user.id}
              isLoading={isLoading}
              onSelectPaciente={(id) => {
                setSelectedPacienteId(id);
                setPacientesSubView('list');
              }}
              onNavigateToNew={() => {
                setSelectedPacienteId(null);
                setPacientesSubView('new');
              }}
              onBackToList={() => {
                setSelectedPacienteId(null);
                setPacientesSubView('list');
              }}
              onRefreshData={() => fetchDashboardData(true)}
            />
          ) : (
            <>
              {/* Banner Boas-Vindas */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 p-8 text-white shadow-xl shadow-teal-900/10">
                <div className="relative z-10 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-semibold mb-3">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Dados sincronizados com o banco Neon</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    Olá, {user.name || 'Nutricionista'}! 👋
                  </h1>
                  <p className="mt-2 text-teal-50 text-sm sm:text-base leading-relaxed">
                    Aqui está o resumo atualizado dos seus atendimentos e acompanhamento de pacientes.
                  </p>
                </div>
              </div>

              {/* Grid dos Cards Principais (Prompt 3) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Card 1 — Total de pacientes ativos */}
                <div 
                  onClick={() => {
                    setSelectedPacienteId(null);
                    setActiveTab('pacientes');
                  }}
                  className="bg-white rounded-3xl p-7 border border-teal-100 shadow-xs hover:shadow-lg hover:border-teal-300 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-teal-600">
                        Card 1
                      </span>
                      <h3 className="text-base font-bold text-teal-950 mt-1">
                        Total de pacientes ativos
                      </h3>
                      <p className="text-xs text-teal-600/70 mt-0.5">
                        Cadastrados por você
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-teal-600 group-hover:text-white transition-all shadow-xs">
                      <UserCheck className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="mt-6 flex items-baseline justify-between">
                    <div>
                      {isLoading ? (
                        <div className="h-10 w-16 bg-teal-100 animate-pulse rounded-lg"></div>
                      ) : (
                        <span className="text-4xl font-extrabold tracking-tight text-teal-950">
                          {totalPacientes}
                        </span>
                      )}
                      <p className="text-xs text-teal-700/60 mt-1 font-medium">
                        {totalPacientes === 1 ? 'Paciente ativo' : 'Pacientes ativos'}
                      </p>
                    </div>

                    <span className="text-xs font-semibold text-teal-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Ver lista <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>

                {/* Card 2 — Consultas da semana */}
                <div className="bg-white rounded-3xl p-7 border border-teal-100 shadow-xs hover:shadow-lg hover:border-teal-300 transition-all flex flex-col justify-between group">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-teal-600">
                        Card 2
                      </span>
                      <h3 className="text-base font-bold text-teal-950 mt-1">
                        Consultas da semana
                      </h3>
                      <p className="text-xs text-teal-600/70 mt-0.5">
                        Semana atual
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-xs">
                      <Calendar className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="mt-6 flex items-baseline justify-between">
                    <div>
                      {isLoading ? (
                        <div className="h-10 w-16 bg-teal-100 animate-pulse rounded-lg"></div>
                      ) : (
                        <span className="text-4xl font-extrabold tracking-tight text-teal-950">
                          {consultasSemana}
                        </span>
                      )}
                      <p className="text-xs text-emerald-700/70 mt-1 font-medium">
                        Registradas nesta semana
                      </p>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-teal-600/80 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-100">
                      <Clock className="w-3 h-3" />
                      <span>Seg — Dom</span>
                    </div>
                  </div>
                </div>

                {/* Card 3 — Pacientes sem retorno */}
                <div className="bg-white rounded-3xl p-7 border border-teal-100 shadow-xs hover:shadow-lg hover:border-teal-300 transition-all flex flex-col justify-between md:col-span-2 lg:col-span-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
                        Card 3
                      </span>
                      <h3 className="text-base font-bold text-teal-950 mt-1">
                        Pacientes sem retorno
                      </h3>
                      <p className="text-xs text-teal-600/70 mt-0.5">
                        Mais de 30 dias sem consulta ou retorno agendado
                      </p>
                    </div>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-xs ${
                      pacientesSemRetorno.length > 0 
                        ? 'bg-amber-50 text-amber-600' 
                        : 'bg-teal-50 text-teal-600'
                    }`}>
                      <AlertCircle className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="mt-4">
                    {isLoading ? (
                      <div className="space-y-2 py-4">
                        <div className="h-6 bg-teal-100 animate-pulse rounded-md"></div>
                        <div className="h-6 bg-teal-100 animate-pulse rounded-md w-3/4"></div>
                      </div>
                    ) : pacientesSemRetorno.length === 0 ? (
                      <div className="py-6 px-4 bg-teal-50/50 rounded-2xl border border-teal-100/60 text-center">
                        <p className="text-sm font-medium text-teal-800">
                          Nenhum paciente sem retorno no momento
                        </p>
                        <span className="text-xs text-teal-600/70 mt-1 block">
                          Todos os pacientes estão em dia com consultas e retornos.
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {pacientesSemRetorno.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => handleNavigateToPatient(item.id)}
                            className="flex items-center justify-between p-3 rounded-2xl bg-amber-50/50 hover:bg-amber-100/60 border border-amber-100/80 transition-colors cursor-pointer group"
                            title={`Clique para ver o perfil de ${item.nome}`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-amber-200/80 text-amber-900 font-bold text-xs flex items-center justify-center shrink-0">
                                {item.nome.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <span className="text-sm font-semibold text-teal-950 group-hover:text-amber-900 truncate block transition-colors">
                                  {item.nome}
                                </span>
                                <span className="text-[11px] text-amber-700/80">
                                  {item.dias_sem_consulta} dias desde a última consulta
                                </span>
                              </div>
                            </div>

                            <ChevronRight className="w-4 h-4 text-amber-600 group-hover:translate-x-1 transition-transform shrink-0" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Seção Informativa de Conexão */}
              <div className="bg-white rounded-3xl p-6 border border-teal-100/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-teal-950">Acesso Restrito & RLS Ativo</h4>
                    <p className="text-xs text-teal-600/80">
                      Você está visualizando exclusivamente os pacientes e consultas vinculados ao seu ID de nutricionista.
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedPacienteId(null);
                    setActiveTab('pacientes');
                  }}
                  className="border-teal-200 text-teal-800 hover:bg-teal-50 text-xs shrink-0 cursor-pointer"
                >
                  Abrir Pasta de Pacientes →
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};
