import React from 'react';

interface ConsultaPonto {
  data: string;
  peso: number;
}

interface PesoChartProps {
  consultas: ConsultaPonto[];
}

export const PesoChart: React.FC<PesoChartProps> = ({ consultas }) => {
  // Ordena cronologicamente crescente para o gráfico temporal
  const ordenadas = [...consultas]
    .filter(c => c.peso !== null && !isNaN(c.peso) && c.peso > 0)
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

  if (ordenadas.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-dashed border-teal-200 text-center flex flex-col items-center justify-center min-h-[220px]">
        <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <p className="text-sm font-bold text-teal-950">Nenhuma consulta registrada ainda</p>
        <p className="text-xs text-teal-600/70 mt-1 max-w-xs">
          O gráfico de evolução de peso será construído automaticamente com os registros de consultas.
        </p>
      </div>
    );
  }

  const formatDataLabel = (d: string) => {
    try {
      const parts = d.split('T')[0].split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
      const dt = new Date(d);
      return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}`;
    } catch {
      return d;
    }
  };

  // Se tiver apenas 1 ponto
  if (ordenadas.length === 1) {
    const p = ordenadas[0];
    return (
      <div className="bg-white rounded-3xl p-6 border border-teal-100 shadow-xs flex flex-col justify-between min-h-[220px]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600">Evolução de Peso</span>
            <h4 className="text-sm font-bold text-teal-950">1 registro inicial</h4>
          </div>
          <span className="text-xl font-extrabold text-teal-900 bg-teal-50 px-3 py-1 rounded-xl border border-teal-100">
            {p.peso.toFixed(1)} kg
          </span>
        </div>
        <div className="bg-gradient-to-t from-teal-50/70 to-white p-6 rounded-2xl border border-teal-100/60 text-center flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center mb-2 shadow-sm shadow-teal-600/30">
            ✓
          </div>
          <p className="text-sm font-bold text-teal-950">{p.peso} kg em {formatDataLabel(p.data)}</p>
          <p className="text-xs text-teal-600/80 mt-0.5">
            Adicione novas consultas ao longo do tempo para visualizar a curva de evolução completa.
          </p>
        </div>
      </div>
    );
  }

  // Múltiplos pontos: traçar SVG suave com gradiente
  const pesos = ordenadas.map(c => c.peso);
  const minPesoRaw = Math.min(...pesos);
  const maxPesoRaw = Math.max(...pesos);
  const paddingY = Math.max(2, (maxPesoRaw - minPesoRaw) * 0.2);
  const minPeso = Math.floor(minPesoRaw - paddingY);
  const maxPeso = Math.ceil(maxPesoRaw + paddingY);
  const pesoDiff = maxPeso - minPeso || 1;

  // Dimensões do viewBox
  const width = 600;
  const height = 220;
  const paddingLeft = 45;
  const paddingRight = 30;
  const paddingTop = 25;
  const paddingBottom = 40;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  const points = ordenadas.map((c, i) => {
    const x = paddingLeft + (i / (ordenadas.length - 1)) * chartW;
    const y = paddingTop + chartH - ((c.peso - minPeso) / pesoDiff) * chartH;
    return { x, y, ...c };
  });

  const pathD = points.reduce((acc, p, idx) => {
    if (idx === 0) return `M ${p.x} ${p.y}`;
    // Curva bezier suave
    const prev = points[idx - 1];
    const cp1x = prev.x + (p.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (p.x - prev.x) / 2;
    const cp2y = p.y;
    return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p.x} ${p.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${paddingTop + chartH} L ${points[0].x} ${paddingTop + chartH} Z`;

  const diferencaTotal = (ordenadas[ordenadas.length - 1].peso - ordenadas[0].peso).toFixed(1);
  const isPerda = Number(diferencaTotal) < 0;

  return (
    <div className="bg-white rounded-3xl p-6 border border-teal-100 shadow-xs space-y-4">
      {/* Header do Gráfico */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600 block">
            Evolução de Peso
          </span>
          <h3 className="text-lg font-bold text-teal-950">
            Acompanhamento ao longo das consultas
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[11px] font-semibold text-teal-700/70 block uppercase">Variação Total</span>
            <span className={`text-sm font-extrabold px-2.5 py-0.5 rounded-lg border inline-block ${
              isPerda 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : Number(diferencaTotal) === 0 
                  ? 'bg-teal-50 text-teal-700 border-teal-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              {Number(diferencaTotal) > 0 ? `+${diferencaTotal}` : diferencaTotal} kg
            </span>
          </div>

          <div className="text-right border-l border-teal-100 pl-3">
            <span className="text-[11px] font-semibold text-teal-700/70 block uppercase">Peso Atual</span>
            <span className="text-base font-extrabold text-teal-950">
              {ordenadas[ordenadas.length - 1].peso.toFixed(1)} kg
            </span>
          </div>
        </div>
      </div>

      {/* SVG Container responsivo */}
      <div className="w-full overflow-hidden">
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-auto max-h-[260px] overflow-visible"
        >
          <defs>
            <linearGradient id="pesoGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0d9488" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#0d9488" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0f766e" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>

          {/* Linhas de grade horizontal */}
          {[0, 0.33, 0.66, 1].map((pct, idx) => {
            const y = paddingTop + chartH * (1 - pct);
            const val = (minPeso + pesoDiff * pct).toFixed(0);
            return (
              <g key={idx}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#e2f1ee"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className="text-[10px] fill-teal-700/60 font-semibold"
                >
                  {val}k
                </text>
              </g>
            );
          })}

          {/* Área preenchida */}
          <path d={areaD} fill="url(#pesoGradient)" />

          {/* Linha principal curva */}
          <path
            d={pathD}
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Pontos nos nós com tooltips visuais */}
          {points.map((p, idx) => (
            <g key={idx} className="group">
              <circle
                cx={p.x}
                cy={p.y}
                r="5"
                fill="#ffffff"
                stroke="#0d9488"
                strokeWidth="3"
                className="transition-all hover:r-7 cursor-pointer"
              />
              {/* Valor em cima de cada ponto */}
              <text
                x={p.x}
                y={p.y - 10}
                textAnchor="middle"
                className="text-[11px] font-extrabold fill-teal-950 select-none"
              >
                {p.peso.toFixed(1)}
              </text>
              {/* Label de data no eixo X */}
              <text
                x={p.x}
                y={paddingTop + chartH + 20}
                textAnchor="middle"
                className="text-[11px] font-medium fill-teal-700 select-none"
              >
                {formatDataLabel(p.data)}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};
