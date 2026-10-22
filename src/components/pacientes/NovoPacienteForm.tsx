import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  User, 
  Activity, 
  Smile, 
  CheckCircle2, 
  AlertCircle,
  Plus, 
  X,
  Scale,
  Ruler,
  HelpCircle,
  Clock,
  Droplets,
  HeartPulse
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { sql } from '@/lib/db';

interface NovoPacienteFormProps {
  nutricionistaId: string;
  onSuccess: (pacienteId: string) => void;
  onCancel: () => void;
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

export const NovoPacienteForm: React.FC<NovoPacienteFormProps> = ({
  nutricionistaId,
  onSuccess,
  onCancel
}) => {
  const [activeTab, setActiveTab] = useState<'pessoal' | 'clinico' | 'habitos'>('pessoal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // --- Aba 1: Pessoal ---
  const [nome, setNome] = useState('');
  const [nomeError, setNomeError] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [dataInicioTratamento, setDataInicioTratamento] = useState(() => new Date().toISOString().split('T')[0]);
  const [sexo, setSexo] = useState<'Feminino' | 'Masculino' | 'Outro' | ''>('');
  const [telefone, setTelefone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');

  // --- Aba 2: Clínico ---
  const [pesoAtual, setPesoAtual] = useState<string>('');
  const [alturaCm, setAlturaCm] = useState<string>('');
  const [objetivosSelecionados, setObjetivosSelecionados] = useState<string[]>([]);
  const [objetivoTextoLivre, setObjetivoTextoLivre] = useState('');
  const [nivelAtividade, setNivelAtividade] = useState<string>('');

  // Patologias
  const [patologiasSelecionadas, setPatologiasSelecionadas] = useState<string[]>([]);
  const [novaPatologia, setNovaPatologia] = useState('');
  const [customPatologias, setCustomPatologias] = useState<string[]>([]);

  // Restrições alimentares
  const [restricoesSelecionadas, setRestricoesSelecionadas] = useState<string[]>([]);
  const [novaRestricao, setNovaRestricao] = useState('');
  const [customRestricoes, setCustomRestricoes] = useState<string[]>([]);

  // Alergias alimentares
  const [alergiasSelecionadas, setAlergiasSelecionadas] = useState<string[]>([]);
  const [novaAlergia, setNovaAlergia] = useState('');
  const [customAlergias, setCustomAlergias] = useState<string[]>([]);

  const [medicamentos, setMedicamentos] = useState('');
  const [suplementos, setSuplementos] = useState('');

  // --- Aba 3: Hábitos ---
  const [refeicoesPorDia, setRefeicoesPorDia] = useState<string>('');
  const [horarioAcorda, setHorarioAcorda] = useState('');
  const [horarioDorme, setHorarioDorme] = useState('');
  const [litrosAgua, setLitrosAgua] = useState<string>('');
  const [praticaAtividadeFisica, setPraticaAtividadeFisica] = useState<'sim' | 'nao' | ''>('');
  const [atividadeFisicaDescricao, setAtividadeFisicaDescricao] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Cálculo da idade a partir da data de nascimento
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

  // Formatação de telefone / whatsapp: (99) 99999-9999 ou (99) 9999-9999
  const formatTelefone = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  // Conversão de números para hora formatada (ex: 6 -> 06:00, 630 -> 06:30, 23 -> 23:00)
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

  // Cálculo de IMC a partir de peso (kg) e altura (cm)
  const imcCalculado = useMemo(() => {
    const peso = parseFloat(pesoAtual.replace(',', '.'));
    const altCm = parseFloat(alturaCm.replace(',', '.'));
    if (!peso || !altCm || altCm <= 0 || peso <= 0) return null;
    const altM = altCm / 100;
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

    return {
      valor: imc.toFixed(1),
      classificacao,
      cor
    };
  }, [pesoAtual, alturaCm]);

  // Handlers para seleção múltipla com opção "Nenhum"
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

  // Adicionar tags customizadas
  const handleAddCustomTag = (
    text: string,
    setText: (t: string) => void,
    customList: string[],
    setCustomList: (c: string[]) => void,
    selectedList: string[],
    setSelectedList: (s: string[]) => void
  ) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (!customList.includes(trimmed)) {
      setCustomList([...customList, trimmed]);
    }
    const withoutNenhum = selectedList.filter(i => i !== 'Nenhum');
    if (!withoutNenhum.includes(trimmed)) {
      setSelectedList([...withoutNenhum, trimmed]);
    }
    setText('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setNomeError('');

    if (!nome.trim()) {
      setNomeError('O nome completo é obrigatório');
      setActiveTab('pessoal');
      return;
    }

    setIsSubmitting(true);

    try {
      // Formatação dos números
      const pesoNum = pesoAtual ? parseFloat(pesoAtual.replace(',', '.')) : null;
      // Altura em metros no banco (ou cm se float) — como o schema é numeric, vamos gravar a altura informada
      const altNum = alturaCm ? parseFloat(alturaCm.replace(',', '.')) : null;
      const refeicoesNum = refeicoesPorDia ? parseInt(refeicoesPorDia, 10) : null;
      const litrosAguaNum = litrosAgua ? parseFloat(litrosAgua.replace(',', '.')) : null;
      const atividadeFisicaBool = praticaAtividadeFisica === 'sim' ? true : praticaAtividadeFisica === 'nao' ? false : null;

      // Unir listas
      const patologiasFinal = patologiasSelecionadas.length > 0 ? patologiasSelecionadas : null;
      const restricoesFinal = restricoesSelecionadas.length > 0 ? restricoesSelecionadas : null;
      const alergiasFinal = alergiasSelecionadas.length > 0 ? alergiasSelecionadas : null;
      const objetivosFinal = objetivosSelecionados.length > 0 ? objetivosSelecionados : null;

      // Inserção no Neon vinculando ao nutricionista_id
      const insertResult = await sql`
        INSERT INTO public.pacientes (
          nutricionista_id,
          nome,
          data_nascimento,
          sexo,
          telefone,
          whatsapp,
          email,
          peso_inicial,
          altura,
          objetivos,
          objetivo_texto,
          nivel_atividade,
          patologias,
          restricoes_alimentares,
          alergias,
          medicamentos,
          suplementos,
          refeicoes_por_dia,
          horario_acorda,
          horario_dorme,
          litros_agua,
          atividade_fisica,
          atividade_fisica_descricao,
          observacoes
        ) VALUES (
          ${nutricionistaId}::uuid,
          ${nome.trim()},
          ${dataNascimento || null},
          ${sexo || null},
          ${telefone || null},
          ${whatsapp || null},
          ${email || null},
          ${pesoNum},
          ${altNum},
          ${objetivosFinal},
          ${objetivoTextoLivre.trim() || null},
          ${nivelAtividade || null},
          ${patologiasFinal},
          ${restricoesFinal},
          ${alergiasFinal},
          ${medicamentos.trim() || null},
          ${suplementos.trim() || null},
          ${refeicoesNum},
          ${horarioAcorda || null},
          ${horarioDorme || null},
          ${litrosAguaNum},
          ${atividadeFisicaBool},
          ${praticaAtividadeFisica === 'sim' ? atividadeFisicaDescricao.trim() || null : null},
          ${observacoes.trim() || null}
        )
        RETURNING id
      `;

      const newId = insertResult[0]?.id;

      // Prompt 5: "Preciso que ao cadastrar o Paciente eu possa colocar a data de início do tratamento, essa data ficará registrada como a primeira consulta"
      if (newId && dataInicioTratamento) {
        try {
          await sql`
            INSERT INTO public.consultas (
              paciente_id,
              data_consulta,
              peso,
              observacoes
            ) VALUES (
              ${newId}::uuid,
              ${dataInicioTratamento}::date,
              ${pesoNum},
              'Início do tratamento nutricional (1ª consulta)'
            )
          `;
        } catch (consultErr) {
          console.error('Erro ao criar primeira consulta automática:', consultErr);
        }
      }

      setSuccessMessage('Paciente cadastrado com sucesso!');

      // Pequeno timeout para o usuário visualizar o feedback de sucesso antes de redirecionar para o perfil
      setTimeout(() => {
        if (newId) {
          onSuccess(String(newId));
        } else {
          onCancel();
        }
      }, 1000);

    } catch (err: any) {
      console.error('Erro ao cadastrar paciente no Neon:', err);
      setErrorMessage(err.message || 'Erro ao salvar paciente no banco de dados. Tente novamente.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onCancel}
          type="button"
          className="inline-flex items-center gap-2 text-sm font-semibold text-teal-800 hover:text-teal-950 transition-colors bg-white px-4 py-2 rounded-xl border border-teal-100 shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-teal-600" />
          Voltar para lista de pacientes
        </button>
      </div>

      {/* Card Principal do Formulário */}
      <div className="bg-white rounded-3xl border border-teal-100 shadow-sm overflow-hidden">
        {/* Banner do Formulário */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-600 text-white">
          <h2 className="text-2xl font-bold">Novo Paciente</h2>
          <p className="text-teal-100/90 text-sm mt-1">
            Preencha os dados do paciente organizados em abas. Apenas o nome completo é obrigatório.
          </p>
        </div>

        {/* Feedback Messages */}
        {successMessage && (
          <div className="m-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-sm">{successMessage}</p>
              <p className="text-xs text-emerald-700">Redirecionando para o perfil do paciente...</p>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="m-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" />
            <div>
              <p className="font-bold text-sm">Não foi possível salvar</p>
              <p className="text-xs text-rose-700">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Abas do Formulário */}
        <div className="border-b border-teal-100 bg-teal-50/40 px-6 pt-3 flex gap-2 sm:gap-4 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('pessoal')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'pessoal'
                ? 'border-teal-600 text-teal-900 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-teal-700/70 hover:text-teal-950'
            }`}
          >
            <User className="w-4 h-4 text-teal-600" />
            <span>1. Pessoal</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('clinico')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'clinico'
                ? 'border-teal-600 text-teal-900 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-teal-700/70 hover:text-teal-950'
            }`}
          >
            <Activity className="w-4 h-4 text-teal-600" />
            <span>2. Clínico</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('habitos')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'habitos'
                ? 'border-teal-600 text-teal-900 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-teal-700/70 hover:text-teal-950'
            }`}
          >
            <Smile className="w-4 h-4 text-teal-600" />
            <span>3. Hábitos</span>
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
          {/* ========================================================= */}
          {/* ABA 1 — PESSOAL */}
          {/* ========================================================= */}
          {activeTab === 'pessoal' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-teal-950 flex items-center gap-2">
                  <User className="w-5 h-5 text-teal-600" />
                  Informações Pessoais
                </h3>
                <p className="text-xs text-teal-700/70 mt-0.5">
                  Dados cadastrais e formas de contato direto com o paciente.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Nome Completo (Obrigatório) */}
                <div className="md:col-span-2">
                  <Input
                    label="Nome Completo *"
                    placeholder="Ex: Maria Clara dos Santos"
                    value={nome}
                    onChange={(e) => {
                      setNome(e.target.value);
                      if (nomeError) setNomeError('');
                    }}
                    error={nomeError}
                    required
                  />
                </div>

                {/* Data de Nascimento */}
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

                {/* Data de Início do Tratamento (Prompt 5) */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-teal-900/80">
                    Data de Início do Tratamento (1ª Consulta)
                  </label>
                  <input
                    type="date"
                    value={dataInicioTratamento}
                    onChange={(e) => setDataInicioTratamento(e.target.value)}
                    className="w-full rounded-xl border border-teal-200/80 bg-white px-3.5 py-2.5 text-sm text-teal-950 shadow-xs focus:border-teal-500 focus:outline-none focus:ring-3 focus:ring-teal-500/20"
                  />
                  <span className="text-[11px] text-teal-600/70 block">
                    Ficará registrada como a 1ª consulta do paciente.
                  </span>
                </div>

                {/* Sexo */}
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

                {/* Telefone */}
                <div>
                  <Input
                    label="Telefone"
                    placeholder="(00) 0000-0000"
                    value={telefone}
                    onChange={(e) => setTelefone(formatTelefone(e.target.value))}
                  />
                </div>

                {/* WhatsApp */}
                <div>
                  <Input
                    label="WhatsApp"
                    placeholder="(00) 00000-0000"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(formatTelefone(e.target.value))}
                  />
                </div>

                {/* Email */}
                <div className="md:col-span-2">
                  <Input
                    label="E-mail"
                    type="email"
                    placeholder="exemplo@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Botão para avançar */}
              <div className="pt-4 flex justify-end">
                <Button
                  type="button"
                  onClick={() => setActiveTab('clinico')}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-semibold cursor-pointer"
                >
                  Avançar para Clínico →
                </Button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* ABA 2 — CLÍNICO */}
          {/* ========================================================= */}
          {activeTab === 'clinico' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-base font-bold text-teal-950 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-teal-600" />
                  Dados Clínicos e Nutricionais
                </h3>
                <p className="text-xs text-teal-700/70 mt-0.5">
                  Medidas corporais iniciais, histórico de saúde e objetivos do paciente.
                </p>
              </div>

              {/* Medidas: Peso, Altura e IMC */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 p-5 bg-teal-50/50 rounded-2xl border border-teal-100">
                {/* Peso */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-teal-900/80">
                    Peso Atual
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ex: 72.5"
                      value={pesoAtual}
                      onChange={(e) => setPesoAtual(e.target.value)}
                      className="w-full rounded-xl border border-teal-200/80 bg-white px-3.5 py-2.5 pr-12 text-sm text-teal-950 shadow-xs focus:border-teal-500 focus:outline-none focus:ring-3 focus:ring-teal-500/20"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs font-bold text-teal-600 pointer-events-none">
                      kg
                    </span>
                  </div>
                </div>

                {/* Altura */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-teal-900/80">
                    Altura
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ex: 175"
                      value={alturaCm}
                      onChange={(e) => setAlturaCm(e.target.value)}
                      className="w-full rounded-xl border border-teal-200/80 bg-white px-3.5 py-2.5 pr-12 text-sm text-teal-950 shadow-xs focus:border-teal-500 focus:outline-none focus:ring-3 focus:ring-teal-500/20"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs font-bold text-teal-600 pointer-events-none">
                      cm
                    </span>
                  </div>
                </div>

                {/* IMC Calculado */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-teal-900/80">
                    IMC (Automático)
                  </label>
                  <div className="h-[42px] px-3.5 rounded-xl border border-teal-200/80 bg-white flex items-center justify-between">
                    {imcCalculado ? (
                      <>
                        <span className="font-extrabold text-teal-950 text-base">
                          {imcCalculado.valor}
                        </span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${imcCalculado.cor}`}>
                          {imcCalculado.classificacao}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-teal-700/50 italic">
                        Informe peso e altura
                      </span>
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
                    value={objetivoTextoLivre}
                    onChange={(e) => setObjetivoTextoLivre(e.target.value)}
                  />
                </div>
              </div>

              {/* Nível de Atividade Física */}
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

              {/* Patologias ou condições de saúde */}
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

                  {customPatologias.map((pat) => (
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

                {/* Input para adicionar livremente */}
                <div className="flex gap-2 max-w-md pt-1">
                  <input
                    type="text"
                    value={novaPatologia}
                    onChange={(e) => setNovaPatologia(e.target.value)}
                    placeholder="Outra patologia..."
                    className="flex-1 rounded-xl border border-teal-200 px-3 py-1.5 text-xs text-teal-950 placeholder-teal-400 outline-none focus:border-teal-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomTag(novaPatologia, setNovaPatologia, customPatologias, setCustomPatologias, patologiasSelecionadas, setPatologiasSelecionadas);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => handleAddCustomTag(novaPatologia, setNovaPatologia, customPatologias, setCustomPatologias, patologiasSelecionadas, setPatologiasSelecionadas)}
                    className="text-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Adicionar
                  </Button>
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

                  {customRestricoes.map((res) => (
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

                <div className="flex gap-2 max-w-md pt-1">
                  <input
                    type="text"
                    value={novaRestricao}
                    onChange={(e) => setNovaRestricao(e.target.value)}
                    placeholder="Outra restrição..."
                    className="flex-1 rounded-xl border border-teal-200 px-3 py-1.5 text-xs text-teal-950 placeholder-teal-400 outline-none focus:border-teal-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomTag(novaRestricao, setNovaRestricao, customRestricoes, setCustomRestricoes, restricoesSelecionadas, setRestricoesSelecionadas);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => handleAddCustomTag(novaRestricao, setNovaRestricao, customRestricoes, setCustomRestricoes, restricoesSelecionadas, setRestricoesSelecionadas)}
                    className="text-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Adicionar
                  </Button>
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

                  {customAlergias.map((alg) => (
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

                <div className="flex gap-2 max-w-md pt-1">
                  <input
                    type="text"
                    value={novaAlergia}
                    onChange={(e) => setNovaAlergia(e.target.value)}
                    placeholder="Outra alergia..."
                    className="flex-1 rounded-xl border border-teal-200 px-3 py-1.5 text-xs text-teal-950 placeholder-teal-400 outline-none focus:border-teal-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomTag(novaAlergia, setNovaAlergia, customAlergias, setCustomAlergias, alergiasSelecionadas, setAlergiasSelecionadas);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => handleAddCustomTag(novaAlergia, setNovaAlergia, customAlergias, setCustomAlergias, alergiasSelecionadas, setAlergiasSelecionadas)}
                    className="text-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Adicionar
                  </Button>
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
                    placeholder="Ex: Puran T4 50mcg em jejum..."
                    className="w-full rounded-xl border border-teal-200/80 bg-white p-3 text-sm text-teal-950 placeholder-teal-400/70 focus:border-teal-500 focus:outline-none focus:ring-3 focus:ring-teal-500/20"
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
                    placeholder="Ex: Creatina 5g, Whey protein 30g..."
                    className="w-full rounded-xl border border-teal-200/80 bg-white p-3 text-sm text-teal-950 placeholder-teal-400/70 focus:border-teal-500 focus:outline-none focus:ring-3 focus:ring-teal-500/20"
                  />
                </div>
              </div>

              {/* Ações de navegação da aba */}
              <div className="pt-4 flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab('pessoal')}
                  className="cursor-pointer border-teal-200 text-teal-800"
                >
                  ← Voltar para Pessoal
                </Button>
                <Button
                  type="button"
                  onClick={() => setActiveTab('habitos')}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-semibold cursor-pointer"
                >
                  Avançar para Hábitos →
                </Button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* ABA 3 — HÁBITOS */}
          {/* ========================================================= */}
          {activeTab === 'habitos' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-teal-950 flex items-center gap-2">
                  <Smile className="w-5 h-5 text-teal-600" />
                  Rotina e Hábitos de Vida
                </h3>
                <p className="text-xs text-teal-700/70 mt-0.5">
                  Horários, hidratação, sono e prática de exercícios físicos.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Refeições por dia */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-teal-900/80">
                    Refeições por dia
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    placeholder="Ex: 4"
                    value={refeicoesPorDia}
                    onChange={(e) => setRefeicoesPorDia(e.target.value)}
                    className="w-full rounded-xl border border-teal-200/80 bg-white px-3.5 py-2.5 text-sm text-teal-950 shadow-xs focus:border-teal-500 focus:outline-none focus:ring-3 focus:ring-teal-500/20"
                  />
                </div>

                {/* Horário que acorda */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-teal-900/80">
                    Horário que acorda
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ex: 6 ou 630"
                      value={horarioAcorda}
                      onChange={(e) => setHorarioAcorda(e.target.value)}
                      onBlur={() => {
                        if (horarioAcorda) {
                          setHorarioAcorda(formatHourString(horarioAcorda));
                        }
                      }}
                      className="w-full rounded-xl border border-teal-200/80 bg-white px-3.5 py-2.5 pr-10 text-sm text-teal-950 shadow-xs focus:border-teal-500 focus:outline-none focus:ring-3 focus:ring-teal-500/20"
                    />
                    <Clock className="w-4 h-4 text-teal-500 absolute right-3 top-3 pointer-events-none" />
                  </div>
                  <span className="text-[11px] text-teal-600/70">
                    Ex: digite 6 → "06:00" ou 630 → "06:30"
                  </span>
                </div>

                {/* Horário que dorme */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-teal-900/80">
                    Horário que dorme
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ex: 23 ou 2230"
                      value={horarioDorme}
                      onChange={(e) => setHorarioDorme(e.target.value)}
                      onBlur={() => {
                        if (horarioDorme) {
                          setHorarioDorme(formatHourString(horarioDorme));
                        }
                      }}
                      className="w-full rounded-xl border border-teal-200/80 bg-white px-3.5 py-2.5 pr-10 text-sm text-teal-950 shadow-xs focus:border-teal-500 focus:outline-none focus:ring-3 focus:ring-teal-500/20"
                    />
                    <Clock className="w-4 h-4 text-teal-500 absolute right-3 top-3 pointer-events-none" />
                  </div>
                  <span className="text-[11px] text-teal-600/70">
                    Ex: digite 23 → "23:00" ou 2230 → "22:30"
                  </span>
                </div>

                {/* Quantidade de água */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-teal-900/80">
                    Água por dia
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ex: 2.5"
                      value={litrosAgua}
                      onChange={(e) => setLitrosAgua(e.target.value)}
                      className="w-full rounded-xl border border-teal-200/80 bg-white px-3.5 py-2.5 pr-14 text-sm text-teal-950 shadow-xs focus:border-teal-500 focus:outline-none focus:ring-3 focus:ring-teal-500/20"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs font-bold text-teal-600 pointer-events-none">
                      litros
                    </span>
                  </div>
                </div>
              </div>

              {/* Atividade física: sim / não */}
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
                      placeholder="Ex: Musculação 4x na semana, Corrida aos sábados"
                      value={atividadeFisicaDescricao}
                      onChange={(e) => setAtividadeFisicaDescricao(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Observações gerais */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-teal-900/80 mb-1.5">
                  Observações Gerais
                </label>
                <textarea
                  rows={3}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Anotações de anamnese, preferências, rotina de trabalho ou histórico relevante..."
                  className="w-full rounded-xl border border-teal-200/80 bg-white p-3.5 text-sm text-teal-950 placeholder-teal-400/70 focus:border-teal-500 focus:outline-none focus:ring-3 focus:ring-teal-500/20"
                />
              </div>

              {/* Ações da aba Hábitos */}
              <div className="pt-4 flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab('clinico')}
                  className="cursor-pointer border-teal-200 text-teal-800"
                >
                  ← Voltar para Clínico
                </Button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* BOTÕES PRINCIPAIS DE SALVAR NO RODAPÉ */}
          {/* ========================================================= */}
          <div className="pt-6 border-t border-teal-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-teal-700/70">
              * O único campo estritamente obrigatório é o <strong>Nome Completo</strong>.
            </span>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                className="w-full sm:w-auto border-teal-200 text-teal-800 hover:bg-teal-50 cursor-pointer"
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                isLoading={isSubmitting}
                className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white font-bold px-8 shadow-md shadow-teal-600/20 cursor-pointer"
              >
                Salvar Paciente
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
