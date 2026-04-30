const http = require("http");
const url = require("url");

class CallbackServer {
  constructor(port = 3000) {
    this.port = port;
    this.server = null;
    this.callbackPromise = null;
    this.callbackResolve = null;
  }

  start() {
    return new Promise((resolve, reject) => {
      this.callbackPromise = new Promise((resolveCallback) => {
        this.callbackResolve = resolveCallback;
      });

      this.server = http.createServer((req, res) => {
        const parsedUrl = url.parse(req.url, true);

        if (parsedUrl.pathname === "/callback") {
          const code = parsedUrl.query.code;
          const error = parsedUrl.query.error;

          if (error) {
            res.writeHead(400, { "Content-Type": "text/html" });
            res.end(`
              <html>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                  <h2 style="color: red;">❌ Authorization Failed</h2>
                  <p>Error: ${error}</p>
                  <p>You can close this window and try again.</p>
                </body>
              </html>
            `);
            this.callbackResolve({ error });
          } else if (code) {
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(`
              <html>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                  <h2 style="color: green;">✅ Authorization Successful!</h2>
                  <p>You can close this window and return to the terminal.</p>
                  <p><small>Authorization code: ${code.substring(0, 10)}...</small></p>
                  <script>
                    // Auto-close window after 3 seconds
                    setTimeout(() => {
                      window.close();
                    }, 3000);
                  </script>
                </body>
              </html>
            `);

            // Resolve the callback promise
            if (this.callbackResolve) {
              this.callbackResolve({ code });
            }
          } else {
            res.writeHead(400, { "Content-Type": "text/html" });
            res.end(`
              <html>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                  <h2 style="color: orange;">⚠️ No Authorization Code</h2>
                  <p>No authorization code found in the URL.</p>
                  <p>You can close this window and try again.</p>
                </body>
              </html>
            `);
            this.callbackResolve({ error: "No authorization code found" });
          }
        } else {
          res.writeHead(404, { "Content-Type": "text/html" });
          res.end(`
            <html>
              <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h2>404 - Page Not Found</h2>
                <p>This is the Spotify authentication callback server.</p>
              </body>
            </html>
          `);
        }
      });

      this.server.listen(this.port, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log(
            `🌐 Callback server running on http://localhost:${this.port}`,
          );
          resolve();
        }
      });

      // Handle server errors
      this.server.on("error", (err) => {
        if (err.code === "EADDRINUSE") {
          console.log(
            `⚠️  Port ${this.port} is already in use. Trying port ${this.port + 1}...`,
          );
          this.port++;
          this.server.close();
          this.start().then(resolve).catch(reject);
        } else {
          reject(err);
        }
      });
    });
  }

  waitForCallback() {
    return this.callbackPromise;
  }

  stop() {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }
}

module.exports = CallbackServer;
