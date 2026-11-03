import React, { useState } from 'react';
import { 
  Sparkles, 
  Save, 
  Calendar, 
  Utensils, 
  Sun, 
  Coffee, 
  Sunset, 
  Moon, 
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface RefeicoesDia {
  cafe_da_manha: string[];
  lanche_manha: string[];
  almoco: string[];
  lanche_tarde: string[];
  jantar: string[];
}

export interface DiaPlano {
  dia: string;
  refeicoes: RefeicoesDia;
}

export interface PlanoSemanalData {
  plano_semanal: DiaPlano[];
}

interface PlanoAlimentarEditorProps {
  plano: PlanoSemanalData;
  isSaving: boolean;
  onSave: (planoAtualizado: PlanoSemanalData) => Promise<void>;
  onCancel?: () => void;
}

const REFEICOES_CONFIG = [
  { key: 'cafe_da_manha' as keyof RefeicoesDia, label: 'Café da Manhã', icon: Coffee, desc: 'Primeira refeição do dia' },
  { key: 'lanche_manha' as keyof RefeicoesDia, label: 'Lanche da Manhã', icon: Sun, desc: 'Lanche intermediário matutino' },
  { key: 'almoco' as keyof RefeicoesDia, label: 'Almoço', icon: Utensils, desc: 'Refeição principal' },
  { key: 'lanche_tarde' as keyof RefeicoesDia, label: 'Lanche da Tarde', icon: Sunset, desc: 'Lanche intermediário vespertino' },
  { key: 'jantar' as keyof RefeicoesDia, label: 'Jantar', icon: Moon, desc: 'Última refeição do dia' },
];

export const PlanoAlimentarEditor: React.FC<PlanoAlimentarEditorProps> = ({
  plano: initialPlano,
  isSaving,
  onSave,
  onCancel,
}) => {
  const [planoData, setPlanoData] = useState<PlanoSemanalData>(() => JSON.parse(JSON.stringify(initialPlano)));
  const [activeDiaIndex, setActiveDiaIndex] = useState(0);

  const dias = planoData.plano_semanal || [];
  const currentDia = dias[activeDiaIndex] || dias[0];

  // Atualizar uma opção específica de uma refeição do dia ativo
  const handleOptionChange = (
    refeicaoKey: keyof RefeicoesDia,
    optionIndex: number,
    newValue: string
  ) => {
    setPlanoData(prev => {
      const copy: PlanoSemanalData = JSON.parse(JSON.stringify(prev));
      const diaAlvo = copy.plano_semanal[activeDiaIndex];
      if (diaAlvo && diaAlvo.refeicoes && diaAlvo.refeicoes[refeicaoKey]) {
        diaAlvo.refeicoes[refeicaoKey][optionIndex] = newValue;
      }
      return copy;
    });
  };

  // Adicionar uma nova opção para a refeição
  const handleAddOption = (refeicaoKey: keyof RefeicoesDia) => {
    setPlanoData(prev => {
      const copy: PlanoSemanalData = JSON.parse(JSON.stringify(prev));
      const diaAlvo = copy.plano_semanal[activeDiaIndex];
      if (diaAlvo && diaAlvo.refeicoes && diaAlvo.refeicoes[refeicaoKey]) {
        diaAlvo.refeicoes[refeicaoKey].push(`Nova opção de alimento`);
      }
      return copy;
    });
  };

  // Remover uma opção da refeição
  const handleRemoveOption = (refeicaoKey: keyof RefeicoesDia, optionIndex: number) => {
    setPlanoData(prev => {
      const copy: PlanoSemanalData = JSON.parse(JSON.stringify(prev));
      const diaAlvo = copy.plano_semanal[activeDiaIndex];
      if (diaAlvo && diaAlvo.refeicoes && diaAlvo.refeicoes[refeicaoKey]) {
        if (diaAlvo.refeicoes[refeicaoKey].length > 1) {
          diaAlvo.refeicoes[refeicaoKey].splice(optionIndex, 1);
        }
      }
      return copy;
    });
  };

  return (
    <div className="bg-white rounded-3xl border border-teal-200 shadow-md p-6 sm:p-8 space-y-6 animate-in fade-in">
      {/* Cabeçalho do Editor */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-teal-100">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            Plano Alimentar em Edição
          </div>
          <h3 className="text-xl font-black text-teal-950">
            Cardápio Semanal Customizável
          </h3>
          <p className="text-xs text-teal-700/80 mt-1">
            Revise e ajuste as opções sugeridas pela IA antes de salvar o plano alimentar no histórico do paciente.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSaving}
              className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs cursor-pointer"
            >
              <X className="w-4 h-4 mr-1" />
              Cancelar
            </Button>
          )}

          <Button
            type="button"
            onClick={() => onSave(planoData)}
            disabled={isSaving}
            className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs shadow-lg shadow-teal-600/25 cursor-pointer px-5"
          >
            {isSaving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Salvando no Banco...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Plano Alimentar
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Abas dos Dias da Semana */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {dias.map((d, index) => {
          const isActive = index === activeDiaIndex;
          return (
            <button
              key={index}
              type="button"
              onClick={() => setActiveDiaIndex(index)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                isActive
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                  : 'bg-teal-50/70 text-teal-800 hover:bg-teal-100/70 border border-teal-100'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 opacity-80" />
              <span>{d.dia}</span>
            </button>
          );
        })}
      </div>

      {/* Conteúdo do Dia Ativo */}
      {currentDia ? (
        <div className="space-y-6 pt-2">
          <div className="flex items-center justify-between bg-teal-50/50 p-3.5 rounded-2xl border border-teal-100">
            <span className="font-bold text-sm text-teal-950 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              Refeições para {currentDia.dia}
            </span>
            <span className="text-xs text-teal-700/70">
              5 opções disponíveis por refeição
            </span>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {REFEICOES_CONFIG.map(({ key, label, icon: Icon, desc }) => {
              const options = currentDia.refeicoes?.[key] || [];

              return (
                <div
                  key={key}
                  className="rounded-2xl border border-teal-100 bg-teal-50/20 p-5 space-y-3.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-teal-950">{label}</h4>
                        <p className="text-[11px] text-teal-600/80">{desc}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddOption(key)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:text-teal-900 bg-white px-2.5 py-1 rounded-lg border border-teal-200 shadow-2xs hover:bg-teal-50 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-teal-600" />
                      Opção Extra
                    </button>
                  </div>

                  {/* Lista de 5 (ou mais) inputs editáveis da refeição */}
                  <div className="space-y-2 pt-1">
                    {options.map((opt, optIndex) => (
                      <div key={optIndex} className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-teal-700 w-16 shrink-0 bg-white px-2 py-2 rounded-lg border border-teal-100 text-center">
                          Opção {optIndex + 1}
                        </span>
                        <div className="flex-1">
                          <Input
                            type="text"
                            value={opt}
                            onChange={(e) => handleOptionChange(key, optIndex, e.target.value)}
                            placeholder={`Ex: 2 ovos mexidos com pão integral`}
                            className="bg-white border-teal-200 text-xs focus:ring-teal-500 py-2"
                          />
                        </div>
                        {options.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(key, optIndex)}
                            title="Remover esta opção"
                            className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Botão Inferior de Persistência */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-teal-100">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSaving}
                className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs cursor-pointer"
              >
                Cancelar Edição
              </Button>
            )}

            <Button
              type="button"
              onClick={() => onSave(planoData)}
              disabled={isSaving}
              className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-sm shadow-md shadow-teal-600/25 px-6 py-2.5 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Salvando Plano Alimentar...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Salvar Plano Alimentar no Banco
                </>
              )}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

