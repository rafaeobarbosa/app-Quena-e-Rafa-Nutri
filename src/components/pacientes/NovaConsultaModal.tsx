import React, { useState } from 'react';
import { X, Calendar, Scale, Ruler, Percent, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { sql } from '@/lib/db';

interface NovaConsultaModalProps {
  isOpen: boolean;
  pacienteId: string;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

export const NovaConsultaModal: React.FC<NovaConsultaModalProps> = ({
  isOpen,
  pacienteId,
  onClose,
  onSuccess
}) => {
  const hoje = new Date().toISOString().split('T')[0];

  const [dataConsulta, setDataConsulta] = useState(hoje);
  const [peso, setPeso] = useState('');
  const [cintura, setCintura] = useState('');
  const [quadril, setQuadril] = useState('');
  const [percentualGordura, setPercentualGordura] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [proximoRetorno, setProximoRetorno] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!dataConsulta) {
      setError('A data da consulta é obrigatória.');
      return;
    }

    const pesoNum = peso ? parseFloat(peso.replace(',', '.')) : null;
    const cinturaNum = cintura ? parseFloat(cintura.replace(',', '.')) : null;
    const quadrilNum = quadril ? parseFloat(quadril.replace(',', '.')) : null;
    const gorduraNum = percentualGordura ? parseFloat(percentualGordura.replace(',', '.')) : null;

    setIsSubmitting(true);

    try {
      // 1. Inserir a nova consulta no Neon
      await sql`
        INSERT INTO public.consultas (
          paciente_id,
          data_consulta,
          peso,
          cintura,
          quadril,
          percentual_gordura,
          observacoes,
          proximo_retorno
        ) VALUES (
          ${pacienteId}::uuid,
          ${dataConsulta}::date,
          ${pesoNum},
          ${cinturaNum},
          ${quadrilNum},
          ${gorduraNum},
          ${observacoes.trim() || null},
          ${proximoRetorno || null}
        )
      `;

      // 2. Se o peso foi informado, atualizar o peso_inicial/atual do paciente caso seja a mais recente
      if (pesoNum !== null) {
        await sql`
          UPDATE public.pacientes
          SET peso_inicial = ${pesoNum}
          WHERE id = ${pacienteId}::uuid
        `;
      }

      await onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar consulta no Neon:', err);
      setError(err.message || 'Erro ao salvar consulta no banco de dados.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-teal-950/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-teal-100 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header do Modal */}
        <div className="p-6 bg-gradient-to-r from-teal-700 to-emerald-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Nova Consulta</h3>
              <p className="text-xs text-teal-100">Registre as medições da consulta do paciente</p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulário com scroll se necessário */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium">
              {error}
            </div>
          )}

          {/* Data da consulta */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-teal-900/80">
              Data da consulta *
            </label>
            <input
              type="date"
              value={dataConsulta}
              onChange={(e) => setDataConsulta(e.target.value)}
              className="w-full rounded-xl border border-teal-200/80 bg-white px-3.5 py-2.5 text-sm text-teal-950 shadow-xs focus:border-teal-500 focus:outline-none focus:ring-3 focus:ring-teal-500/20"
              required
            />
          </div>

          {/* Peso atual */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-teal-900/80">
              Peso atual em kg
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Ex: 71.8"
                value={peso}
                onChange={(e) => setPeso(e.target.value)}
                className="w-full rounded-xl border border-teal-200/80 bg-white px-3.5 py-2.5 pr-12 text-sm text-teal-950 shadow-xs focus:border-teal-500 focus:outline-none focus:ring-3 focus:ring-teal-500/20"
              />
              <span className="absolute right-3.5 top-2.5 text-xs font-bold text-teal-600 pointer-events-none">
                kg
              </span>
            </div>
          </div>

          {/* Medidas corporais: Cintura, Quadril, % Gordura */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-teal-900/80">
                Cintura (opcional)
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ex: 78"
                  value={cintura}
                  onChange={(e) => setCintura(e.target.value)}
                  className="w-full rounded-xl border border-teal-200/80 bg-white px-3 py-2 text-sm text-teal-950 focus:border-teal-500 focus:outline-none"
                />
                <span className="absolute right-2.5 top-2 text-[11px] font-bold text-teal-600 pointer-events-none">
                  cm
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-teal-900/80">
                Quadril (opcional)
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ex: 98"
                  value={quadril}
                  onChange={(e) => setQuadril(e.target.value)}
                  className="w-full rounded-xl border border-teal-200/80 bg-white px-3 py-2 text-sm text-teal-950 focus:border-teal-500 focus:outline-none"
                />
                <span className="absolute right-2.5 top-2 text-[11px] font-bold text-teal-600 pointer-events-none">
                  cm
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-teal-900/80">
                % Gordura (opcional)
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ex: 21.5"
                  value={percentualGordura}
                  onChange={(e) => setPercentualGordura(e.target.value)}
                  className="w-full rounded-xl border border-teal-200/80 bg-white px-3 py-2 text-sm text-teal-950 focus:border-teal-500 focus:outline-none"
                />
                <span className="absolute right-2.5 top-2 text-[11px] font-bold text-teal-600 pointer-events-none">
                  %
                </span>
              </div>
            </div>
          </div>

          {/* Próximo retorno */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-teal-900/80">
              Próximo Retorno
            </label>
            <input
              type="date"
              value={proximoRetorno}
              onChange={(e) => setProximoRetorno(e.target.value)}
              className="w-full rounded-xl border border-teal-200/80 bg-white px-3.5 py-2.5 text-sm text-teal-950 shadow-xs focus:border-teal-500 focus:outline-none focus:ring-3 focus:ring-teal-500/20"
            />
          </div>

          {/* Observações da consulta */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-teal-900/80">
              Observações
            </label>
            <textarea
              rows={3}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Adesão à dieta, sintomas relatados, mudanças na rotina..."
              className="w-full rounded-xl border border-teal-200/80 bg-white p-3 text-sm text-teal-950 placeholder-teal-400/70 focus:border-teal-500 focus:outline-none focus:ring-3 focus:ring-teal-500/20"
            />
          </div>

          {/* Botões do Rodapé */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-teal-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="border-teal-200 text-teal-800 hover:bg-teal-50 cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-6 cursor-pointer shadow-md shadow-teal-600/20"
            >
              Salvar consulta
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
