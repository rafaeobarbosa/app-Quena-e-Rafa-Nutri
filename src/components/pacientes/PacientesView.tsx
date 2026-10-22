import React from 'react';
import { PacientesList, PacienteItem } from './PacientesList';
import { NovoPacienteForm } from './NovoPacienteForm';
import { PerfilPacienteView } from './PerfilPacienteView';

export interface PacienteCompleto {
  id: string;
  nutricionista_id: string;
  nome: string;
  data_nascimento?: string | null;
  sexo?: string | null;
  telefone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  peso_inicial?: number | string | null;
  altura?: number | string | null;
  objetivos?: string[] | null;
  objetivo_texto?: string | null;
  nivel_atividade?: string | null;
  patologias?: string[] | null;
  restricoes_alimentares?: string[] | null;
  alergias?: string[] | null;
  medicamentos?: string | null;
  suplementos?: string | null;
  refeicoes_por_dia?: number | null;
  horario_acorda?: string | null;
  horario_dorme?: string | null;
  litros_agua?: number | string | null;
  atividade_fisica?: boolean | null;
  atividade_fisica_descricao?: string | null;
  observacoes?: string | null;
  created_at: string;
  ultima_consulta?: string | null;
}

interface PacientesViewProps {
  pacientes: PacienteCompleto[];
  selectedPacienteId: string | null;
  currentSubView: 'list' | 'new';
  nutricionistaId: string;
  isLoading: boolean;
  onSelectPaciente: (id: string | null) => void;
  onNavigateToNew: () => void;
  onBackToList: () => void;
  onRefreshData: () => Promise<void>;
}

export const PacientesView: React.FC<PacientesViewProps> = ({
  pacientes,
  selectedPacienteId,
  currentSubView,
  nutricionistaId,
  isLoading,
  onSelectPaciente,
  onNavigateToNew,
  onBackToList,
  onRefreshData
}) => {
  // Sub-view: Formulário de cadastro de novo paciente
  if (currentSubView === 'new') {
    return (
      <NovoPacienteForm
        nutricionistaId={nutricionistaId}
        onCancel={onBackToList}
        onSuccess={async (newId) => {
          await onRefreshData();
          onSelectPaciente(newId);
        }}
      />
    );
  }

  // Paciente selecionado -> Perfil do Paciente completo conforme Prompt 5
  // Organizado em 3 seções: Dados do Paciente (editáveis em abas), Consultas (gráfico + histórico + nova consulta) e Planos Alimentares
  if (selectedPacienteId) {
    return (
      <PerfilPacienteView
        pacienteId={selectedPacienteId}
        nutricionistaId={nutricionistaId}
        onBack={() => onSelectPaciente(null)}
        onDataUpdated={onRefreshData}
      />
    );
  }

  // Visualização padrão: Lista de pacientes com busca e botão de novo paciente
  return (
    <PacientesList
      pacientes={pacientes}
      isLoading={isLoading}
      onSelectPaciente={(id) => onSelectPaciente(id)}
      onNewPaciente={onNavigateToNew}
    />
  );
};
