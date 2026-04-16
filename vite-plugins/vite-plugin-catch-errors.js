import fs from 'node:fs'
import path from 'node:path'

export function catchErrors() {
    return {
        name: 'catch-errors',

        configureServer(server) {
            server.middlewares.use('/__catch_error', (req, res, next) => {
                if (req.method === 'POST') {
                    let body = ''
                    req.on('data', chunk => body += chunk)
                    req.on('end', () => {
                        try {
                            const logPath = path.resolve(process.cwd(), 'web-errors.log')
                            const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19)
                            const entry = `[${timestamp}]\n${body}\n\n`
                            fs.appendFileSync(logPath, entry, 'utf8')
                        } catch (e) { }
                        res.end('ok')
                    })
                }
            })
        },

        transformIndexHtml: {
            order: 'pre',
            handler(html) {
                const script = `
<script type="module">
if (import.meta.env.DEV) {
  // 捕获全局 JavaScript 运行时错误
  window.addEventListener('error', (e) => {
    fetch('/__catch_error', {
      method: 'POST',
      body: e.error?.stack || e.message || 'Unknown error'
    }).catch(()=>{})
  })

  // 捕获未处理的 Promise rejection
  window.addEventListener('unhandledrejection', (e) => {
    fetch('/__catch_error', {
      method: 'POST',
      body: e.reason?.stack || String(e.reason)
    }).catch(()=>{})
  })

  // 重写 console.error
  const _originalConsoleError = console.error
  console.error = (...args) => {
    _originalConsoleError(...args)
    fetch('/__catch_error', {
      method: 'POST',
      body: args.map(a => {
        try {
          return typeof a === 'object' ? JSON.stringify(a) : String(a)
        } catch {
          return String(a)
        }
      }).join(' ')
    }).catch(()=>{})
  }
}
</script>
`
                return html.replace('<head>', '<head>' + script)
            }
        }
    }
}