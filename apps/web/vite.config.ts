import path from "path"
import { fileURLToPath } from "url"
import fs from "fs"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, "../../"), "")
  
  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'local-api-middleware',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url?.startsWith('/api/')) {
              const apiName = req.url.split('/api/')[1].split('?')[0]
              const handlerPath = path.resolve(__dirname, "../../api", `${apiName}.js`)
              
              if (fs.existsSync(handlerPath)) {
                try {
                  // Inject env variables for the handler
                  Object.assign(process.env, env)
                  
                  const { default: handler } = await import(/* @vite-ignore */ handlerPath)
                  
                  // Simple shim for Vercel-style handler
                  res.status = (code) => { res.statusCode = code; return res; }
                  res.json = (data) => {
                    res.setHeader('Content-Type', 'application/json')
                    res.end(JSON.stringify(data))
                    return res;
                  }
                  
                  if (req.method === 'POST') {
                    let body = ''
                    req.on('data', chunk => { body += chunk })
                    req.on('end', async () => {
                      try {
                        req.body = JSON.parse(body)
                        await handler(req, res)
                      } catch (e) {
                        res.status(400).json({ error: 'Invalid JSON' })
                      }
                    })
                  } else {
                    await handler(req, res)
                  }
                  return
                } catch (error) {
                  console.error(`Error in API handler ${apiName}:`, error)
                  res.status(500).json({ error: 'Internal Server Error', details: error.message })
                  return
                }
              }
            }
            next()
          })
        }
      }
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }
})
