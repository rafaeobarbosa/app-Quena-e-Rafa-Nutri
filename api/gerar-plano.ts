import { GoogleGenerativeAI } from '@google/generative-ai';

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

export interface PlanoSemanalResponse {
  plano_semanal: DiaPlano[];
}

// Fallback manual inteligente para resiliência caso a IA esteja indisponível ou ocorra falha de rede/quota
export function gerarPlanoManualFallback(dados: any): PlanoSemanalResponse {
  const restricoes = Array.isArray(dados?.restricoes_alimentares) ? dados.restricoes_alimentares : [];
  const alergias = Array.isArray(dados?.alergias) ? dados.alergias : [];
  const semLactose = restricoes.includes('Lactose') || alergias.includes('Leite');
  const semGluten = restricoes.includes('Glúten') || alergias.includes('Trigo');
  const semCarneVermelha = restricoes.includes('Carne vermelha');

  const dias = [
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado',
    'Domingo'
  ];

  return {
    plano_semanal: dias.map((dia, idx) => ({
      dia,
      refeicoes: {
        cafe_da_manha: [
          semGluten ? '2 ovos mexidos com tapioca e azeite extravirgem' : '2 fatias de pão integral com ovos mexidos',
          semLactose ? 'Vitamina de frutas com bebida de aveia/amêndoas' : 'Iogurte natural desnatado com morangos frescos e chia',
          'Mamão papaia com aveia em flocos e sementes de abóbora',
          'Café preto sem açúcar ou com gotas de estévia',
          'Panqueca de banana, aveia e canela em pó'
        ],
        lanche_manha: [
          '1 maçã fatiada com canela em pó',
          'Mix de castanhas (3 castanhas-do-pará e 4 nozes)',
          '1 banana prata com pasta de amendoim sem açúcar',
          '1 fatia de melão ou melancia fresca',
          'Iogurte vegetal ou fruta da estação com linhaça'
        ],
        almoco: [
          semCarneVermelha
            ? (idx % 2 === 0 ? 'Filé de peito de frango grelhado com ervas' : 'Filé de peixe assado com azeite e limão')
            : (idx % 3 === 0 ? 'Patinho moído refogado com legumes' : 'Peito de frango grelhado ou filé de tilápia'),
          'Arroz integral ou arroz com cúrcuma (4 colheres de sopa)',
          'Feijão carioca ou feijão preto fresco (1 concha média)',
          'Salada farta de folhas verdes (alface, rúcula e agrião) com tomate e cenoura ralada',
          'Legumes no vapor (brócolis, abobrinha e cenoura) com azeite de oliva'
        ],
        lanche_tarde: [
          '1 copo de vitamina de frutas vermelhas com semente de chia',
          semGluten ? 'Biscoito de arroz com pasta de ricota ou homus' : 'Torrada integral com pasta de atum light',
          '1 pera fresca com punhado de castanha de caju',
          'Ovo cozido com fio de azeite e orégano',
          'Chá de camomila ou hortelã com 1 fruta cítrica'
        ],
        jantar: [
          idx % 2 === 0
            ? 'Omelete de 2 ovos com espinafre, tomate e cebolinha'
            : 'Sopa nutritiva de legumes com frango desfiado',
          'Salada colorida de folhas com pepino e azeite de oliva',
          'Purê de abóbora cabotiá ou batata doce assada',
          'Filé de peixe grelhado ou frango com abobrinha refogada',
          'Chá calmante (erva-doce ou melissa) antes de dormir'
        ]
      }
    }))
  };
}

export async function processarGeracaoPlano(dadosPaciente: any, apiKey?: string): Promise<PlanoSemanalResponse> {
  const geminiKey = apiKey || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

  if (!geminiKey) {
    console.warn('[gerar-plano] GEMINI_API_KEY não configurada no ambiente. Utilizando plano alimentar estruturado de fallback.');
    return gerarPlanoManualFallback(dadosPaciente);
  }

  const genAI = new GoogleGenerativeAI(geminiKey);

  // Schema estruturado para garantir 100% de conformidade com o formato solicitado
  const schema = {
    type: "object",
    properties: {
      plano_semanal: {
        type: "array",
        description: "Lista com os 7 dias da semana do plano alimentar",
        items: {
          type: "object",
          properties: {
            dia: {
              type: "string",
              description: "Nome do dia da semana em português (ex: Segunda-feira)"
            },
            refeicoes: {
              type: "object",
              properties: {
                cafe_da_manha: {
                  type: "array",
                  description: "Exatamente 5 opções para o café da manhã",
                  items: { type: "string" }
                },
                lanche_manha: {
                  type: "array",
                  description: "Exatamente 5 opções para o lanche da manhã",
                  items: { type: "string" }
                },
                almoco: {
                  type: "array",
                  description: "Exatamente 5 opções para o almoço",
                  items: { type: "string" }
                },
                lanche_tarde: {
                  type: "array",
                  description: "Exatamente 5 opções para o lanche da tarde",
                  items: { type: "string" }
                },
                jantar: {
                  type: "array",
                  description: "Exatamente 5 opções para o jantar",
                  items: { type: "string" }
                }
              },
              required: ["cafe_da_manha", "lanche_manha", "almoco", "lanche_tarde", "jantar"]
            }
          },
          required: ["dia", "refeicoes"]
        }
      }
    },
    required: ["plano_semanal"]
  };

  // Instanciação do modelo gemini-2.5-flash / gemini-1.5-flash com structured output
  // Suporta modelos como gemini-2.5-flash, gemini-1.5-flash ou outros disponíveis na API
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      // @ts-ignore
      responseSchema: schema,
      temperature: 0.7,
    }
  });

  const promptTexto = `Você é um nutricionista clínico profissional especialista na culinária e rotina brasileira.
Gere um plano alimentar semanal completo, saudável e diversificado com base nos dados do paciente fornecidos abaixo.

Dados do Paciente (Metas, Alergias, Restrições e Histórico):
${typeof dadosPaciente === 'string' ? dadosPaciente : JSON.stringify(dadosPaciente, null, 2)}

# Regras Críticas de Execução:
- Você deve responder APENAS e estritamente o objeto JSON solicitado.
- Não inclua blocos de código markdown (como \`\`\`json ... \`\`\`), explicações, introduções ou textos complementares.
- Adapte o cardápio rigorosamente a quaisquer alergias ou restrições descritas nos dados.
- Utilize alimentos comuns, acessíveis e culturalmente aceitos no Brasil.
- Evite repetições monótonas de alimentos nos dias seguidos.

O formato do JSON retornado deve seguir exatamente esta estrutura:
{
  "plano_semanal": [
    {
      "dia": "Segunda-feira",
      "refeicoes": {
        "cafe_da_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "almoco": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_tarde": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "jantar": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"]
      }
    }
  ]
}`;

  try {
    const result = await model.generateContent(promptTexto);
    const response = await result.response;
    const rawText = response.text();

    if (!rawText) {
      throw new Error('Resposta vazia recebida do Gemini.');
    }

    // Limpeza de possíveis blocos markdown residuais
    const sanitizedText = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, '')
      .trim();

    const parsed = JSON.parse(sanitizedText) as PlanoSemanalResponse;

    if (!parsed?.plano_semanal || !Array.isArray(parsed.plano_semanal)) {
      throw new Error('Formato retornado pela IA não contém a chave "plano_semanal".');
    }

    return parsed;
  } catch (err: any) {
    console.error('[gerar-plano] Falha na chamada da API Gemini:', err);
    throw err;
  }
}

// Serverless Handler compatível com Vercel / Node.js
export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Método não permitido. Utilize POST.' }));
    return;
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        // já é texto ou inválido
      }
    }

    const dadosPaciente = body?.dados_do_paciente || body?.paciente || body;

    const plano = await processarGeracaoPlano(dadosPaciente);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(plano));
  } catch (error: any) {
    console.error('[api/gerar-plano] Erro:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      error: error?.message || 'Falha ao gerar plano alimentar com IA',
      fallbackDisponivel: true
    }));
  }
}
