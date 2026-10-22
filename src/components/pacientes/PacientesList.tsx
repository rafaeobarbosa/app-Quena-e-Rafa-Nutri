import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Calendar, 
  Target, 
  ChevronRight, 
  Activity,
  CalendarCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface PacienteItem {
  id: string;
  nome: string;
  objetivo_texto?: string | null;
  objetivos?: string[] | null;
  ultima_consulta?: string | null;
  created_at: string;
}

interface PacientesListProps {
  pacientes: PacienteItem[];
  isLoading: boolean;
  onSelectPaciente: (id: string) => void;
  onNewPaciente: () => void;
}

export const PacientesList: React.FC<PacientesListProps> = ({
  pacientes,
  isLoading,
  onSelectPaciente,
  onNewPaciente
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPacientes = pacientes.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  const getObjetivoDisplay = (paciente: PacienteItem) => {
    if (paciente.objetivo_texto && paciente.objetivo_texto.trim() !== '') {
      return paciente.objetivo_texto;
    }
    if (paciente.objetivos && paciente.objetivos.length > 0) {
      return paciente.objetivos.join(', ');
    }
    return 'Objetivo não informado';
  };

  const formatData = (dateString?: string | null) => {
    if (!dateString) return 'Sem consultas ainda';
    try {
      const parts = dateString.split('T')[0].split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-teal-950 flex items-center gap-2.5">
            <Users className="w-7 h-7 text-teal-600" />
            Pacientes
          </h1>
          <p className="text-sm text-teal-700/80 mt-0.5">
            Visualize o histórico de atendimentos e gerencie seus pacientes.
          </p>
        </div>

        <Button
          onClick={onNewPaciente}
          className="bg-teal-600 hover:bg-teal-700 text-white font-semibold flex items-center gap-2 rounded-xl shadow-md shadow-teal-600/20 cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Novo Paciente</span>
        </Button>
      </div>

      {/* Barra de Busca */}
      <div className="bg-white p-4 rounded-2xl border border-teal-100 shadow-xs flex items-center gap-3">
        <Search className="w-5 h-5 text-teal-500 shrink-0" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar paciente por nome..."
          className="w-full bg-transparent text-sm text-teal-950 placeholder-teal-400/80 outline-none"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="text-xs text-teal-600 hover:text-teal-800 font-semibold px-2 py-1 rounded-md hover:bg-teal-50 cursor-pointer"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Conteúdo da Listagem */}
      {isLoading ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-teal-100 shadow-xs">
          <div className="w-10 h-10 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-medium text-teal-900">Carregando pacientes cadastrados...</p>
        </div>
      ) : pacientes.length === 0 ? (
        /* Caso não haja nenhum paciente no banco */
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-teal-200 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-teal-950">Nenhum paciente cadastrado ainda</h3>
          <p className="text-sm text-teal-600/80 max-w-md mx-auto mt-1 mb-6">
            Comece cadastrando seu primeiro paciente com os dados pessoais, clínicos e hábitos.
          </p>
          <Button
            onClick={onNewPaciente}
            className="bg-teal-600 hover:bg-teal-700 text-white font-semibold inline-flex items-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Cadastrar Primeiro Paciente</span>
          </Button>
        </div>
      ) : filteredPacientes.length === 0 ? (
        /* Busca não encontrou resultados */
        <div className="bg-white rounded-3xl p-10 text-center border border-teal-100 shadow-xs">
          <p className="text-sm text-teal-800 font-medium">
            Nenhum paciente encontrado com o termo "<span className="font-bold">{searchTerm}</span>".
          </p>
          <button
            onClick={() => setSearchTerm('')}
            className="mt-3 text-xs text-teal-600 hover:underline font-semibold cursor-pointer"
          >
            Limpar busca
          </button>
        </div>
      ) : (
        /* Listagem de Pacientes */
        <div className="bg-white rounded-3xl border border-teal-100 shadow-xs overflow-hidden">
          <div className="p-4 bg-teal-50/40 border-b border-teal-100/60 flex items-center justify-between text-xs font-semibold text-teal-800">
            <span>Listando {filteredPacientes.length} {filteredPacientes.length === 1 ? 'paciente' : 'pacientes'}</span>
            <span className="text-teal-600/70">Clique para abrir o perfil</span>
          </div>

          <div className="divide-y divide-teal-50">
            {filteredPacientes.map((paciente) => (
              <div
                key={paciente.id}
                onClick={() => onSelectPaciente(paciente.id)}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-teal-50/50 transition-colors cursor-pointer group"
              >
                {/* Nome & Avatar */}
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-400 text-white font-bold text-lg flex items-center justify-center shrink-0 shadow-sm shadow-teal-600/20 group-hover:scale-105 transition-transform">
                    {paciente.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-base text-teal-950 group-hover:text-teal-700 transition-colors truncate">
                      {paciente.nome}
                    </h3>
                    
                    {/* Objetivo do paciente */}
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-teal-700/80">
                      <Target className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                      <span className="truncate max-w-xs sm:max-w-md font-medium">
                        {getObjetivoDisplay(paciente)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Data da última consulta & Seta de ação */}
                <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-teal-50">
                  <div className="text-left sm:text-right">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-600/70 block">
                      Última consulta
                    </span>
                    <span className="text-xs font-bold text-teal-950 flex items-center sm:justify-end gap-1.5 mt-0.5">
                      <CalendarCheck className="w-3.5 h-3.5 text-teal-600" />
                      {formatData(paciente.ultima_consulta)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-teal-700 bg-teal-50 group-hover:bg-teal-100/80 px-3 py-1.5 rounded-full border border-teal-100/80 transition-colors">
                      Ver perfil
                    </span>
                    <ChevronRight className="w-4 h-4 text-teal-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
