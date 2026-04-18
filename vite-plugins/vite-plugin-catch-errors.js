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
                            const data = JSON.parse(body)
                            const timestamp = data.t || new Date().toLocaleString()
                            const message = data.m || body
                            const entry = `[${timestamp}]\n${message}\n\n`
                            fs.appendFileSync(logPath, entry, 'utf8')
                        } catch (e) {
                            // Fallback for non-JSON body
                            try {
                                const logPath = path.resolve(process.cwd(), 'web-errors.log')
                                const timestamp = new Date().toLocaleString()
                                const entry = `[${timestamp}]\n${body}\n\n`
                                fs.appendFileSync(logPath, entry, 'utf8')
                            } catch { }
                        }
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
      body: JSON.stringify({
        t: new Date().toLocaleString(),
        m: e.error?.stack || e.message || 'Unknown error'
      })
    }).catch(()=>{})
  })

  // 捕获未处理的 Promise rejection
  window.addEventListener('unhandledrejection', (e) => {
    fetch('/__catch_error', {
      method: 'POST',
      body: JSON.stringify({
        t: new Date().toLocaleString(),
        m: e.reason?.stack || String(e.reason)
      })
    }).catch(()=>{})
  })

  // 重写 console.error
  const _originalConsoleError = console.error
  console.error = (...args) => {
    _originalConsoleError(...args)
    fetch('/__catch_error', {
      method: 'POST',
      body: JSON.stringify({
        t: new Date().toLocaleString(),
        m: args.map(a => {
          try { return typeof a === 'object' ? JSON.stringify(a) : String(a) } catch { return String(a) }
        }).join(' ')
      })
    }).catch(()=>{})
  }

  // 重写 console.warn
  const _originalConsoleWarn = console.warn
  console.warn = (...args) => {
    _originalConsoleWarn(...args)
    fetch('/__catch_error', {
      method: 'POST',
      body: JSON.stringify({
        t: new Date().toLocaleString(),
        m: '[WARN] ' + args.map(a => {
          try { return typeof a === 'object' ? JSON.stringify(a) : String(a) } catch { return String(a) }
        }).join(' ')
      })
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