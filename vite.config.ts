import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { processarGeracaoPlano, gerarPlanoManualFallback } from './api/gerar-plano.ts'

// Plugin para interceptar /api/gerar-plano no ambiente de desenvolvimento local (Vite)
function devApiPlugin() {
  return {
    name: 'dev-api-gerar-plano',
    configureServer(server: any) {
      server.middlewares.use('/api/gerar-plano', async (req: any, res: any) => {
        // Habilitar CORS
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

        let bodyRaw = '';
        req.on('data', (chunk: any) => {
          bodyRaw += chunk;
        });

        req.on('end', async () => {
          try {
            const body = bodyRaw ? JSON.parse(bodyRaw) : {};
            const dadosPaciente = body?.dados_do_paciente || body?.paciente || body;

            try {
              const plano = await processarGeracaoPlano(dadosPaciente);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(plano));
            } catch (err: any) {
              console.warn('[Vite Dev Server] Erro ao chamar Gemini, acionando fallback manual:', err.message);
              // Se a chave não estiver configurada ou a API der timeout/erro, retorna o fallback seguro
              const fallback = gerarPlanoManualFallback(dadosPaciente);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(fallback));
            }
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message || 'Erro interno no servidor' }));
          }
        });
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Disponibiliza as variáveis no process.env para a função serverless
  if (env.GEMINI_API_KEY) {
    process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
      devApiPlugin(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  };
});
