import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  ArrowLeft, 
  User, 
  Activity, 
  Smile, 
  Calendar, 
  Plus, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Ruler,
  Scale,
  Percent,
  CalendarCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { sql } from '@/lib/db';
import { PesoChart } from './PesoChart';
import { NovaConsultaModal } from './NovaConsultaModal';
import { PacienteCompleto } from './PacientesView';

interface PerfilPacienteViewProps {
  pacienteId: string;
  nutricionistaId: string;
  onBack: () => void;
  onDataUpdated: () => Promise<void>;
}

export interface ConsultaItem {
  id: string;
  paciente_id: string;
  data_consulta: string;
  peso: number | null;
  cintura: number | null;
  quadril: number | null;
  percentual_gordura: number | null;
  observacoes: string | null;
  proximo_retorno: string | null;
  created_at: string;
}

export interface PlanoAlimentarItem {
  id: string;
  paciente_id: string;
  conteudo: any;
  created_at: string;
}

const OBJETIVOS_OPCOES = [
  'Emagrecer',
  'Ganhar massa',
  'Controlar diabetes',
  'Saúde geral',
  'Performance esportiva',
  'Reeducação alimentar',
];

const NIVEIS_ATIVIDADE = [
  'Sedentário',
  'Levemente ativo',
  'Moderadamente ativo',
  'Muito ativo',
  'Extremamente ativo',
];

const PATOLOGIAS_OPCOES = [
  'Diabetes',
  'Hipertensão',
  'Hipotireoidismo',
  'Hipertireoidismo',
  'Síndrome do ovário policístico',
  'Doença celíaca',
  'Colesterol alto',
];

const RESTRICOES_OPCOES = [
  'Lactose',
  'Glúten',
  'Açúcar',
  'Carne vermelha',
  'Frutos do mar',
];

const ALERGIAS_OPCOES = [
  'Amendoim',
  'Leite',
  'Ovo',
  'Soja',
  'Trigo',
  'Frutos do mar',
];

export const PerfilPacienteView: React.FC<PerfilPacienteViewProps> = ({
  pacienteId,
  nutricionistaId,
  onBack,
  onDataUpdated
}) => {
  // Navegação geral entre as 3 seções do Prompt 5
  const [activeMainSection, setActiveMainSection] = useState<'dados' | 'consultas' | 'planos'>('dados');
  const [activeDataTab, setActiveDataTab] = useState<'pessoal' | 'clinico' | 'habitos'>('pessoal');

  // Estados de carregamento
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Modal de Nova Consulta
  const [isNovaConsultaOpen, setIsNovaConsultaOpen] = useState(false);

  // Modal / Visualização de Plano Alimentar do Histórico
  const [planoVisualizado, setPlanoVisualizado] = useState<PlanoAlimentarItem | null>(null);

  // Dados do paciente carregados do Neon
  const [paciente, setPaciente] = useState<PacienteCompleto | null>(null);

  // Consultas do paciente carregadas do Neon
  const [consultas, setConsultas] = useState<ConsultaItem[]>([]);

  // Planos alimentares do paciente carregados do Neon
  const [planos, setPlanos] = useState<PlanoAlimentarItem[]>([]);

  // --- Campos editáveis da Seção 1 (Dados do Paciente) ---
  // Aba 1: Pessoal
  const [nome, setNome] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [sexo, setSexo] = useState<string>('');
  const [telefone, setTelefone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');

  // Aba 2: Clínico
  const [pesoAtual, setPesoAtual] = useState('');
  const [alturaCm, setAlturaCm] = useState('');
  const [objetivosSelecionados, setObjetivosSelecionados] = useState<string[]>([]);
  const [objetivoTexto, setObjetivoTexto] = useState('');
  const [nivelAtividade, setNivelAtividade] = useState('');
  const [patologiasSelecionadas, setPatologiasSelecionadas] = useState<string[]>([]);
  const [restricoesSelecionadas, setRestricoesSelecionadas] = useState<string[]>([]);
  const [alergiasSelecionadas, setAlergiasSelecionadas] = useState<string[]>([]);
  const [medicamentos, setMedicamentos] = useState('');
  const [suplementos, setSuplementos] = useState('');

  // Aba 3: Hábitos
  const [refeicoesPorDia, setRefeicoesPorDia] = useState('');
  const [horarioAcorda, setHorarioAcorda] = useState('');
  const [horarioDorme, setHorarioDorme] = useState('');
  const [litrosAgua, setLitrosAgua] = useState('');
  const [praticaAtividadeFisica, setPraticaAtividadeFisica] = useState<'sim' | 'nao' | ''>('');
  const [atividadeFisicaDescricao, setAtividadeFisicaDescricao] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Carregar dados completos do paciente, consultas e planos em tempo real
  const loadPacienteData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Dados do paciente
      const pacRes = await sql`
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
          p.created_at::text as created_at
        FROM public.pacientes p
        WHERE p.id = ${pacienteId}::uuid
          AND p.nutricionista_id = ${nutricionistaId}::uuid
      `;

      if (pacRes.length > 0) {
        const p = pacRes[0] as PacienteCompleto;
        setPaciente(p);

        // Preencher formulários editáveis
        setNome(p.nome || '');
        setDataNascimento(p.data_nascimento ? p.data_nascimento.split('T')[0] : '');
        setSexo(p.sexo || '');
        setTelefone(p.telefone || '');
        setWhatsapp(p.whatsapp || '');
        setEmail(p.email || '');

        setPesoAtual(p.peso_inicial ? String(p.peso_inicial) : '');
        setAlturaCm(p.altura ? String(p.altura) : '');
        setObjetivosSelecionados(p.objetivos || []);
        setObjetivoTexto(p.objetivo_texto || '');
        setNivelAtividade(p.nivel_atividade || '');
        setPatologiasSelecionadas(p.patologias || []);
        setRestricoesSelecionadas(p.restricoes_alimentares || []);
        setAlergiasSelecionadas(p.alergias || []);
        setMedicamentos(p.medicamentos || '');
        setSuplementos(p.suplementos || '');

        setRefeicoesPorDia(p.refeicoes_por_dia ? String(p.refeicoes_por_dia) : '');
        setHorarioAcorda(p.horario_acorda || '');
        setHorarioDorme(p.horario_dorme || '');
        setLitrosAgua(p.litros_agua ? String(p.litros_agua) : '');
        setPraticaAtividadeFisica(p.atividade_fisica === true ? 'sim' : p.atividade_fisica === false ? 'nao' : '');
        setAtividadeFisicaDescricao(p.atividade_fisica_descricao || '');
        setObservacoes(p.observacoes || '');
      }

      // 2. Consultas do paciente (ordem cronológica decrescente para a lista)
      const consRes = await sql`
        SELECT 
          id,
          paciente_id,
          data_consulta::text as data_consulta,
          peso,
          cintura,
          quadril,
          percentual_gordura,
          observacoes,
          proximo_retorno::text as proximo_retorno,
          created_at::text as created_at
        FROM public.consultas
        WHERE paciente_id = ${pacienteId}::uuid
        ORDER BY data_consulta DESC, created_at DESC
      `;
      setConsultas(consRes as ConsultaItem[]);

      // 3. Planos alimentares do paciente (ordem cronológica decrescente)
      const planRes = await sql`
        SELECT 
          id,
          paciente_id,
          conteudo,
          created_at::text as created_at
        FROM public.planos_alimentares
        WHERE paciente_id = ${pacienteId}::uuid
        ORDER BY created_at DESC
      `;
      setPlanos(planRes as PlanoAlimentarItem[]);

    } catch (err) {
      console.error('Erro ao carregar dados do perfil do paciente:', err);
    } finally {
      setIsLoading(false);
    }
  }, [pacienteId, nutricionistaId]);

  useEffect(() => {
    loadPacienteData();
  }, [loadPacienteData]);

  // Cálculo da idade a partir da data de nascimento editada
  const idadeCalculada = useMemo(() => {
    if (!dataNascimento) return null;
    const birthDate = new Date(dataNascimento);
    if (isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? age : null;
  }, [dataNascimento]);

  // Cálculo de IMC a partir de peso e altura
  const imcCalculado = useMemo(() => {
    const peso = parseFloat(pesoAtual.replace(',', '.'));
    const altCm = parseFloat(alturaCm.replace(',', '.'));
    if (!peso || !altCm || altCm <= 0 || peso <= 0) return null;
    const altM = altCm > 3 ? altCm / 100 : altCm;
    const imc = peso / (altM * altM);
    if (isNaN(imc) || !isFinite(imc)) return null;

    let classificacao = '';
    let cor = 'text-teal-700 bg-teal-50 border-teal-200';
    if (imc < 18.5) {
      classificacao = 'Abaixo do peso';
      cor = 'text-amber-700 bg-amber-50 border-amber-200';
    } else if (imc < 25) {
      classificacao = 'Peso adequado';
      cor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
    } else if (imc < 30) {
      classificacao = 'Sobrepeso';
      cor = 'text-amber-700 bg-amber-50 border-amber-200';
    } else {
      classificacao = 'Obesidade';
      cor = 'text-rose-700 bg-rose-50 border-rose-200';
    }

    return { valor: imc.toFixed(1), classificacao, cor };
  }, [pesoAtual, alturaCm]);

  // Formatação de telefone
  const formatTelefone = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  // Formatação de hora
  const formatHourString = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 4);
    if (!raw) return '';
    if (raw.length <= 2) {
      const h = parseInt(raw, 10);
      const safeH = isNaN(h) ? 0 : Math.min(23, h);
      return `${String(safeH).padStart(2, '0')}:00`;
    }
    const h = parseInt(raw.slice(0, 2), 10);
    const m = parseInt(raw.slice(2), 10);
    const safeH = isNaN(h) ? 0 : Math.min(23, h);
    const safeM = isNaN(m) ? 0 : Math.min(59, m);
    return `${String(safeH).padStart(2, '0')}:${String(safeM).padStart(2, '0')}`;
  };

  // Toggle de seleção múltipla com suporte a "Nenhum"
  const toggleArrayOption = (
    item: string,
    list: string[],
    setList: (val: string[]) => void
  ) => {
    if (item === 'Nenhum') {
      if (list.includes('Nenhum')) {
        setList([]);
      } else {
        setList(['Nenhum']);
      }
      return;
    }
    const withoutNenhum = list.filter(i => i !== 'Nenhum');
    if (withoutNenhum.includes(item)) {
      setList(withoutNenhum.filter(i => i !== item));
    } else {
      setList([...withoutNenhum, item]);
    }
  };

  // Salvar alterações na Seção 1 (Dados do paciente)
  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(false);

    if (!nome.trim()) {
      setSaveError('O nome completo é obrigatório.');
      return;
    }

    setIsSaving(true);
    try {
      const pesoNum = pesoAtual ? parseFloat(pesoAtual.replace(',', '.')) : null;
      const altNum = alturaCm ? parseFloat(alturaCm.replace(',', '.')) : null;
      const refeicoesNum = refeicoesPorDia ? parseInt(refeicoesPorDia, 10) : null;
      const litrosAguaNum = litrosAgua ? parseFloat(litrosAgua.replace(',', '.')) : null;
      const atividadeFisicaBool = praticaAtividadeFisica === 'sim' ? true : praticaAtividadeFisica === 'nao' ? false : null;

      const patologiasFinal = patologiasSelecionadas.length > 0 ? patologiasSelecionadas : null;
      const restricoesFinal = restricoesSelecionadas.length > 0 ? restricoesSelecionadas : null;
      const alergiasFinal = alergiasSelecionadas.length > 0 ? alergiasSelecionadas : null;
      const objetivosFinal = objetivosSelecionados.length > 0 ? objetivosSelecionados : null;

      await sql`
        UPDATE public.pacientes
        SET
          nome = ${nome.trim()},
          data_nascimento = ${dataNascimento || null},
          sexo = ${sexo || null},
          telefone = ${telefone || null},
          whatsapp = ${whatsapp || null},
          email = ${email || null},
          peso_inicial = ${pesoNum},
          altura = ${altNum},
          objetivos = ${objetivosFinal},
          objetivo_texto = ${objetivoTexto.trim() || null},
          nivel_atividade = ${nivelAtividade || null},
          patologias = ${patologiasFinal},
          restricoes_alimentares = ${restricoesFinal},
          alergias = ${alergiasFinal},
          medicamentos = ${medicamentos.trim() || null},
          suplementos = ${suplementos.trim() || null},
          refeicoes_por_dia = ${refeicoesNum},
          horario_acorda = ${horarioAcorda || null},
          horario_dorme = ${horarioDorme || null},
          litros_agua = ${litrosAguaNum},
          atividade_fisica = ${atividadeFisicaBool},
          atividade_fisica_descricao = ${praticaAtividadeFisica === 'sim' ? atividadeFisicaDescricao.trim() || null : null},
          observacoes = ${observacoes.trim() || null}
        WHERE id = ${pacienteId}::uuid
          AND nutricionista_id = ${nutricionistaId}::uuid
      `;

      setSaveSuccess(true);
      await onDataUpdated();

      setTimeout(() => {
        setSaveSuccess(false);
      }, 4000);
    } catch (err: any) {
      console.error('Erro ao atualizar paciente no Neon:', err);
      setSaveError(err.message || 'Erro ao salvar alterações no banco.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDataHora = (d?: string | null) => {
    if (!d) return '—';
    try {
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return d;
      const dia = String(dt.getDate()).padStart(2, '0');
      const mes = String(dt.getMonth() + 1).padStart(2, '0');
      const ano = dt.getFullYear();
      const horas = String(dt.getHours()).padStart(2, '0');
      const minutos = String(dt.getMinutes()).padStart(2, '0');
      return `${dia}/${mes}/${ano} às ${horas}:${minutos}`;
    } catch {
      return d;
    }
  };

  const formatDataString = (d?: string | null) => {
    if (!d) return '—';
    try {
      // Se for formato YYYY-MM-DD
      const datePart = d.split('T')[0].split(' ')[0];
      const parts = datePart.split('-');
      if (parts.length === 3) {
        return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
      }
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return d;
      const dia = String(dt.getDate()).padStart(2, '0');
      const mes = String(dt.getMonth() + 1).padStart(2, '0');
      const ano = dt.getFullYear();
      return `${dia}/${mes}/${ano}`;
    } catch {
      return d;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-teal-100 shadow-xs">
        <div className="w-10 h-10 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm font-medium text-teal-900">Carregando dados do paciente do Neon...</p>
      </div>
    );
  }

  if (!paciente) {
    return (
      <div className="bg-white rounded-3xl p-10 text-center border border-teal-100 shadow-xs space-y-4">
        <p className="text-base font-bold text-teal-950">Paciente não encontrado</p>
        <Button onClick={onBack} variant="outline" className="border-teal-200 text-teal-800">
          Voltar para lista de pacientes
        </Button>
      </div>
    );
  }

  // Prepara dados para o gráfico de evolução de peso
  const pontosGrafico = consultas
    .filter(c => c.peso !== null && Number(c.peso) > 0)
    .map(c => ({
      data: c.data_consulta,
      peso: Number(c.peso)
    }));

  return (
    <div className="space-y-6">
      {/* Barra Superior de Navegação */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={onBack}
          type="button"
          className="inline-flex items-center gap-2 text-sm font-semibold text-teal-800 hover:text-teal-950 transition-colors bg-white px-4 py-2 rounded-xl border border-teal-100 shadow-xs cursor-pointer self-start"
        >
          <ArrowLeft className="w-4 h-4 text-teal-600" />
          Voltar para lista de pacientes
        </button>

        <div className="text-xs text-teal-700/60 font-mono bg-white px-3 py-1.5 rounded-lg border border-teal-100 self-start sm:self-auto">
          ID: {paciente.id}
        </div>
      </div>

      {/* Header com Avatar e Nome do Paciente */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-teal-100 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-400 text-white font-bold text-2xl flex items-center justify-center shadow-md shadow-teal-500/20 shrink-0">
              {paciente.nome.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-teal-950">{paciente.nome}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-teal-700/80 mt-1">
                <span>Cadastrado em {formatDataHora(paciente.created_at)}</span>
                {consultas.length > 0 && (
                  <>
                    <span>•</span>
                    <span className="font-semibold text-teal-800">
                      Última consulta: {formatDataString(consultas[0].data_consulta)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Paciente Ativo
          </div>
        </div>
      </div>

      {/* Navegação entre as 3 Seções Principais (Prompt 5) */}
      <div className="bg-white rounded-2xl p-2 border border-teal-100 shadow-xs flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveMainSection('dados')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeMainSection === 'dados'
              ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-sm'
              : 'text-teal-800 hover:bg-teal-50'
          }`}
        >
          <User className="w-4 h-4" />
          <span>1. Dados do Paciente</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMainSection('consultas')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeMainSection === 'consultas'
              ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-sm'
              : 'text-teal-800 hover:bg-teal-50'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>2. Consultas</span>
          {consultas.length > 0 && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              activeMainSection === 'consultas' ? 'bg-white/20 text-white' : 'bg-teal-100 text-teal-800'
            }`}>
              {consultas.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveMainSection('planos')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeMainSection === 'planos'
              ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-sm'
              : 'text-teal-800 hover:bg-teal-50'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>3. Planos Alimentares</span>
          {planos.length > 0 && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              activeMainSection === 'planos' ? 'bg-white/20 text-white' : 'bg-teal-100 text-teal-800'
            }`}>
              {planos.length}
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SEÇÃO 1 — DADOS DO PACIENTE (EDITÁVEIS DIRETAMENTE)                        */}
      {/* ========================================================================= */}
      {activeMainSection === 'dados' && (
        <div className="bg-white rounded-3xl border border-teal-100 shadow-sm overflow-hidden">
          {/* Header & Feedback */}
          <div className="p-6 border-b border-teal-100 bg-teal-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-teal-950">Ficha Cadastral do Paciente</h3>
              <p className="text-xs text-teal-700/80 mt-0.5">
                Altere os campos diretamente e clique em "Salvar alterações".
              </p>
            </div>

            {saveSuccess && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Alterações salvas no Neon com sucesso!
              </div>
            )}

            {saveError && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                {saveError}
              </div>
            )}
          </div>

          {/* Abas da Seção de Dados: Pessoal, Clínico e Hábitos */}
          <div className="border-b border-teal-100 bg-teal-50/40 px-6 pt-3 flex gap-2 sm:gap-4 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveDataTab('pessoal')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeDataTab === 'pessoal'
                  ? 'border-teal-600 text-teal-900 bg-white rounded-t-xl shadow-xs'
                  : 'border-transparent text-teal-700/70 hover:text-teal-950'
              }`}
            >
              <User className="w-4 h-4 text-teal-600" />
              <span>Pessoal</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDataTab('clinico')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeDataTab === 'clinico'
                  ? 'border-teal-600 text-teal-900 bg-white rounded-t-xl shadow-xs'
                  : 'border-transparent text-teal-700/70 hover:text-teal-950'
              }`}
            >
              <Activity className="w-4 h-4 text-teal-600" />
              <span>Clínico</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDataTab('habitos')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeDataTab === 'habitos'
                  ? 'border-teal-600 text-teal-900 bg-white rounded-t-xl shadow-xs'
                  : 'border-transparent text-teal-700/70 hover:text-teal-950'
              }`}
            >
              <Smile className="w-4 h-4 text-teal-600" />
              <span>Hábitos</span>
            </button>
          </div>

          <form onSubmit={handleSaveChanges} className="p-6 sm:p-8 space-y-6">
            {/* Aba Pessoal */}
            {activeDataTab === 'pessoal' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <Input
                      label="Nome Completo *"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-teal-900/80">
                      Data de Nascimento
                    </label>
                    <input
                      type="date"
                      value={dataNascimento}
                      onChange={(e) => setDataNascimento(e.target.value)}
                      className="w-full rounded-xl border border-teal-200/80 bg-white px-3.5 py-2.5 text-sm text-teal-950 shadow-xs focus:border-teal-500 focus:outline-none focus:ring-3 focus:ring-teal-500/20"
                    />
                    {idadeCalculada !== null && (
                      <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 inline-block">
                        Idade calculada: {idadeCalculada} {idadeCalculada === 1 ? 'ano' : 'anos'}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-teal-900/80">
                      Sexo
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['Feminino', 'Masculino', 'Outro'] as const).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setSexo(sexo === opt ? '' : opt)}
                          className={`py-2.5 px-3 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                            sexo === opt
                              ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                              : 'bg-white text-teal-900 border-teal-200 hover:bg-teal-50'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Input
                      label="Telefone"
                      value={telefone}
                      onChange={(e) => setTelefone(formatTelefone(e.target.value))}
                    />
                  </div>

                  <div>
                    <Input
                      label="WhatsApp"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(formatTelefone(e.target.value))}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Input
                      label="E-mail"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Aba Clínico */}
            {activeDataTab === 'clinico' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 p-5 bg-teal-50/50 rounded-2xl border border-teal-100">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-teal-900/80">
                      Peso Atual (kg)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={pesoAtual}
                        onChange={(e) => setPesoAtual(e.target.value)}
                        className="w-full rounded-xl border border-teal-200/80 bg-white px-3.5 py-2.5 pr-12 text-sm text-teal-950 focus:border-teal-500 focus:outline-none"
                      />
                      <span className="absolute right-3.5 top-2.5 text-xs font-bold text-teal-600 pointer-events-none">
                        kg
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-teal-900/80">
                      Altura (cm)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={alturaCm}
                        onChange={(e) => setAlturaCm(e.target.value)}
                        className="w-full rounded-xl border border-teal-200/80 bg-white px-3.5 py-2.5 pr-12 text-sm text-teal-950 focus:border-teal-500 focus:outline-none"
                      />
                      <span className="absolute right-3.5 top-2.5 text-xs font-bold text-teal-600 pointer-events-none">
                        cm
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-teal-900/80">
                      IMC (Automático)
                    </label>
                    <div className="h-[42px] px-3.5 rounded-xl border border-teal-200/80 bg-white flex items-center justify-between">
                      {imcCalculado ? (
                        <>
                          <span className="font-extrabold text-teal-950 text-base">{imcCalculado.valor}</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${imcCalculado.cor}`}>
                            {imcCalculado.classificacao}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-teal-700/50 italic">Informe peso e altura</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Objetivos */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-teal-900/80">
                    Objetivo (Múltipla escolha)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {OBJETIVOS_OPCOES.map((obj) => {
                      const isSelected = objetivosSelecionados.includes(obj);
                      return (
                        <button
                          key={obj}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setObjetivosSelecionados(objetivosSelecionados.filter(i => i !== obj));
                            } else {
                              setObjetivosSelecionados([...objetivosSelecionados, obj]);
                            }
                          }}
                          className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                              : 'bg-white text-teal-900 border-teal-200 hover:bg-teal-50'
                          }`}
                        >
                          {obj}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-2">
                    <Input
                      placeholder="Adicione detalhes ou outro objetivo específico..."
                      value={objetivoTexto}
                      onChange={(e) => setObjetivoTexto(e.target.value)}
                    />
                  </div>
                </div>

                {/* Nível de Atividade */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-teal-900/80">
                    Nível de Atividade Física (Seleção única)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                    {NIVEIS_ATIVIDADE.map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setNivelAtividade(nivelAtividade === lvl ? '' : lvl)}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center ${
                          nivelAtividade === lvl
                            ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                            : 'bg-white text-teal-900 border-teal-200 hover:bg-teal-50'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Patologias */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-teal-900/80">
                    Patologias ou condições de saúde
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => toggleArrayOption('Nenhum', patologiasSelecionadas, setPatologiasSelecionadas)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                        patologiasSelecionadas.includes('Nenhum')
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-teal-900 border-teal-200 hover:bg-teal-50'
                      }`}
                    >
                      Nenhum
                    </button>
                    {PATOLOGIAS_OPCOES.map((pat) => (
                      <button
                        key={pat}
                        type="button"
                        onClick={() => toggleArrayOption(pat, patologiasSelecionadas, setPatologiasSelecionadas)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                          patologiasSelecionadas.includes(pat)
                            ? 'bg-teal-600 text-white border-teal-600'
                            : 'bg-white text-teal-900 border-teal-200 hover:bg-teal-50'
                        }`}
                      >
                        {pat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Restrições Alimentares */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-teal-900/80">
                    Restrições alimentares
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => toggleArrayOption('Nenhum', restricoesSelecionadas, setRestricoesSelecionadas)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                        restricoesSelecionadas.includes('Nenhum')
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-teal-900 border-teal-200 hover:bg-teal-50'
                      }`}
                    >
                      Nenhum
                    </button>
                    {RESTRICOES_OPCOES.map((res) => (
                      <button
                        key={res}
                        type="button"
                        onClick={() => toggleArrayOption(res, restricoesSelecionadas, setRestricoesSelecionadas)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                          restricoesSelecionadas.includes(res)
                            ? 'bg-teal-600 text-white border-teal-600'
                            : 'bg-white text-teal-900 border-teal-200 hover:bg-teal-50'
                        }`}
                      >
                        {res}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Alergias Alimentares */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-teal-900/80">
                    Alergias alimentares
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => toggleArrayOption('Nenhum', alergiasSelecionadas, setAlergiasSelecionadas)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                        alergiasSelecionadas.includes('Nenhum')
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-teal-900 border-teal-200 hover:bg-teal-50'
                      }`}
                    >
                      Nenhum
                    </button>
                    {ALERGIAS_OPCOES.map((alg) => (
                      <button
                        key={alg}
                        type="button"
                        onClick={() => toggleArrayOption(alg, alergiasSelecionadas, setAlergiasSelecionadas)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                          alergiasSelecionadas.includes(alg)
                            ? 'bg-teal-600 text-white border-teal-600'
                            : 'bg-white text-teal-900 border-teal-200 hover:bg-teal-50'
                        }`}
                      >
                        {alg}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Medicamentos & Suplementos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-teal-900/80 mb-1.5">
                      Medicamentos Contínuos
                    </label>
                    <textarea
                      rows={2}
                      value={medicamentos}
                      onChange={(e) => setMedicamentos(e.target.value)}
                      className="w-full rounded-xl border border-teal-200/80 bg-white p-3 text-sm text-teal-950 focus:border-teal-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-teal-900/80 mb-1.5">
                      Suplementos em Uso
                    </label>
                    <textarea
                      rows={2}
                      value={suplementos}
                      onChange={(e) => setSuplementos(e.target.value)}
                      className="w-full rounded-xl border border-teal-200/80 bg-white p-3 text-sm text-teal-950 focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Aba Hábitos */}
            {activeDataTab === 'habitos' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-teal-900/80">
                      Refeições por dia
                    </label>
                    <input
                      type="number"
                      value={refeicoesPorDia}
                      onChange={(e) => setRefeicoesPorDia(e.target.value)}
                      className="w-full rounded-xl border border-teal-200/80 bg-white px-3.5 py-2.5 text-sm text-teal-950 focus:border-teal-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-teal-900/80">
                      Horário que acorda
                    </label>
                    <input
                      type="text"
                      value={horarioAcorda}
                      onChange={(e) => setHorarioAcorda(e.target.value)}
                      onBlur={() => {
                        if (horarioAcorda) setHorarioAcorda(formatHourString(horarioAcorda));
                      }}
                      className="w-full rounded-xl border border-teal-200/80 bg-white px-3.5 py-2.5 text-sm text-teal-950 focus:border-teal-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-teal-900/80">
                      Horário que dorme
                    </label>
                    <input
                      type="text"
                      value={horarioDorme}
                      onChange={(e) => setHorarioDorme(e.target.value)}
                      onBlur={() => {
                        if (horarioDorme) setHorarioDorme(formatHourString(horarioDorme));
                      }}
                      className="w-full rounded-xl border border-teal-200/80 bg-white px-3.5 py-2.5 text-sm text-teal-950 focus:border-teal-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-teal-900/80">
                      Água por dia (litros)
                    </label>
                    <input
                      type="text"
                      value={litrosAgua}
                      onChange={(e) => setLitrosAgua(e.target.value)}
                      className="w-full rounded-xl border border-teal-200/80 bg-white px-3.5 py-2.5 text-sm text-teal-950 focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-3 p-5 bg-teal-50/40 rounded-2xl border border-teal-100">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-teal-900/80">
                    Pratica atividade física?
                  </label>
                  <div className="flex gap-3">
                    {(['sim', 'nao'] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setPraticaAtividadeFisica(praticaAtividadeFisica === opt ? '' : opt)}
                        className={`py-2 px-6 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                          praticaAtividadeFisica === opt
                            ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                            : 'bg-white text-teal-900 border-teal-200 hover:bg-teal-50'
                        }`}
                      >
                        {opt === 'sim' ? 'Sim' : 'Não'}
                      </button>
                    ))}
                  </div>

                  {praticaAtividadeFisica === 'sim' && (
                    <div className="pt-2">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-teal-900/80 mb-1.5">
                        Qual atividade e frequência semanal?
                      </label>
                      <Input
                        value={atividadeFisicaDescricao}
                        onChange={(e) => setAtividadeFisicaDescricao(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-teal-900/80 mb-1.5">
                    Observações Gerais
                  </label>
                  <textarea
                    rows={3}
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    className="w-full rounded-xl border border-teal-200/80 bg-white p-3.5 text-sm text-teal-950 focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Botão de Salvar Alterações */}
            <div className="pt-6 border-t border-teal-100 flex items-center justify-between">
              <span className="text-xs text-teal-700/70">
                Os dados serão atualizados em tempo real no banco Neon.
              </span>
              <Button
                type="submit"
                isLoading={isSaving}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-8 shadow-md shadow-teal-600/20 cursor-pointer"
              >
                Salvar alterações
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEÇÃO 2 — CONSULTAS (GRÁFICO + LISTA CRONOLÓGICA + MODAL NOVA CONSULTA)   */}
      {/* ========================================================================= */}
      {activeMainSection === 'consultas' && (
        <div className="space-y-6">
          {/* Gráfico de Evolução de Peso em Destaque (Prompt 5) */}
          <PesoChart consultas={pontosGrafico} />

          {/* Header da Lista de Consultas com Botão "Nova Consulta" */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-teal-950 flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-teal-600" />
                Histórico de Consultas
              </h3>
              <p className="text-xs text-teal-700/80 mt-0.5">
                Listagem em ordem cronológica decrescente (mais recente primeiro).
              </p>
            </div>

            <Button
              onClick={() => setIsNovaConsultaOpen(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white font-semibold flex items-center gap-2 shadow-md shadow-teal-600/20 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Consulta</span>
            </Button>
          </div>

          {/* Lista de Consultas */}
          {consultas.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-dashed border-teal-200">
              <p className="text-sm font-bold text-teal-950">Nenhuma consulta registrada ainda</p>
              <p className="text-xs text-teal-600/70 mt-1 max-w-sm mx-auto mb-4">
                Clique no botão abaixo para adicionar a primeira consulta ou retorno deste paciente.
              </p>
              <Button
                onClick={() => setIsNovaConsultaOpen(true)}
                className="bg-teal-600 hover:bg-teal-700 text-white text-xs cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-1" />
                Registrar Consulta
              </Button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-teal-100 shadow-xs overflow-hidden divide-y divide-teal-50">
              {consultas.map((c) => (
                <div key={c.id} className="p-5 sm:p-6 hover:bg-teal-50/40 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Data da Consulta & Peso */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 text-teal-700 flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          {new Date(c.data_consulta).toLocaleString('pt-BR', { month: 'short' })}
                        </span>
                        <span className="text-base font-extrabold text-teal-950 leading-none">
                          {c.data_consulta.split('T')[0].split('-')[2] || new Date(c.data_consulta).getDate()}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-base text-teal-950">
                            Consulta em {formatDataString(c.data_consulta)}
                          </h4>
                        </div>
                        <p className="text-xs text-teal-700/70 mt-0.5">
                          Registrado no sistema
                        </p>
                      </div>
                    </div>

                    {/* Medidas da Consulta: Peso, Cintura, Quadril, % Gordura, Retorno */}
                    <div className="flex flex-wrap items-center gap-4 text-xs">
                      {c.peso !== null && (
                        <div className="px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-100">
                          <span className="text-teal-600/70 font-semibold uppercase text-[10px] block">Peso</span>
                          <span className="font-extrabold text-teal-950 text-sm">{c.peso} kg</span>
                        </div>
                      )}

                      {c.cintura !== null && (
                        <div className="px-3 py-1.5 rounded-xl bg-teal-50/60 border border-teal-100/70">
                          <span className="text-teal-600/70 font-semibold uppercase text-[10px] block">Cintura</span>
                          <span className="font-bold text-teal-950">{c.cintura} cm</span>
                        </div>
                      )}

                      {c.quadril !== null && (
                        <div className="px-3 py-1.5 rounded-xl bg-teal-50/60 border border-teal-100/70">
                          <span className="text-teal-600/70 font-semibold uppercase text-[10px] block">Quadril</span>
                          <span className="font-bold text-teal-950">{c.quadril} cm</span>
                        </div>
                      )}

                      {c.percentual_gordura !== null && (
                        <div className="px-3 py-1.5 rounded-xl bg-teal-50/60 border border-teal-100/70">
                          <span className="text-teal-600/70 font-semibold uppercase text-[10px] block">% Gordura</span>
                          <span className="font-bold text-teal-950">{c.percentual_gordura}%</span>
                        </div>
                      )}

                      {c.proximo_retorno && (
                        <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200">
                          <span className="text-amber-700 font-semibold uppercase text-[10px] block">Próximo Retorno</span>
                          <span className="font-bold text-amber-950">{formatDataString(c.proximo_retorno)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Observações da Consulta */}
                  {c.observacoes && (
                    <div className="mt-3 pt-3 border-t border-teal-50/80">
                      <span className="text-[11px] font-bold text-teal-700/80 block uppercase tracking-wider mb-1">
                        Observações
                      </span>
                      <p className="text-xs text-teal-900 bg-teal-50/30 p-2.5 rounded-xl border border-teal-100/60">
                        {c.observacoes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEÇÃO 3 — PLANOS ALIMENTARES                                              */}
      {/* ========================================================================= */}
      {activeMainSection === 'planos' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-teal-950 flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" />
                Planos Alimentares
              </h3>
              <p className="text-xs text-teal-700/80 mt-0.5">
                Histórico de dietas e planos gerados para este paciente.
              </p>
            </div>

            {/* Botão bem visível conforme Prompt 5 (funcionalidade completa no próximo prompt) */}
            <Button
              onClick={() => {
                alert('A geração de planos com IA será implementada na próxima etapa!');
              }}
              className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold flex items-center gap-2 shadow-lg shadow-teal-600/25 px-6 py-2.5 cursor-pointer self-start sm:self-auto"
            >
              <Sparkles className="w-4 h-4 text-emerald-200 animate-pulse" />
              <span>Gerar Plano Alimentar</span>
            </Button>
          </div>

          {/* Histórico de Planos */}
          {planos.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-teal-200">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3">
                <FileText className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-teal-950">Nenhum plano alimentar gerado ainda</h4>
              <p className="text-xs text-teal-600/70 mt-1 max-w-sm mx-auto">
                Quando você gerar um plano alimentar para este paciente, ele aparecerá aqui com seu histórico completo.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white rounded-3xl border border-teal-100 shadow-xs divide-y divide-teal-50 overflow-hidden">
                {planos.map((plano) => (
                  <div
                    key={plano.id}
                    onClick={() => setPlanoVisualizado(plano)}
                    className="p-5 flex items-center justify-between hover:bg-teal-50/50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-teal-950 group-hover:text-teal-700 transition-colors">
                          Plano Alimentar • {new Date(plano.created_at).toLocaleDateString('pt-BR')}
                        </h4>
                        <p className="text-xs text-teal-600/70">
                          Gerado às {new Date(plano.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-semibold text-teal-700 bg-teal-50 group-hover:bg-teal-100/80 px-3 py-1.5 rounded-full border border-teal-100/80 transition-colors">
                      Ver conteúdo completo →
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Modal de visualização do conteúdo completo do plano */}
          {planoVisualizado && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-teal-950/40 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white rounded-3xl border border-teal-100 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-teal-700 to-emerald-600 text-white flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg">Conteúdo do Plano Alimentar</h3>
                    <p className="text-xs text-teal-100">
                      Gerado em {new Date(planoVisualizado.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <button
                    onClick={() => setPlanoVisualizado(null)}
                    className="text-white hover:bg-white/20 p-2 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Fechar
                  </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-4">
                  <pre className="p-4 rounded-2xl bg-teal-50/50 text-xs text-teal-950 font-mono overflow-x-auto whitespace-pre-wrap border border-teal-100">
                    {typeof planoVisualizado.conteudo === 'object'
                      ? JSON.stringify(planoVisualizado.conteudo, null, 2)
                      : String(planoVisualizado.conteudo)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de Nova Consulta */}
      <NovaConsultaModal
        isOpen={isNovaConsultaOpen}
        pacienteId={paciente.id}
        onClose={() => setIsNovaConsultaOpen(false)}
        onSuccess={async () => {
          await loadPacienteData();
          await onDataUpdated();
        }}
      />
    </div>
  );
};
