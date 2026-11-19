// Pelayan statik kecil untuk ujian halaman docs/sim/ (J8): fail di bawah satu folder sahaja, jenis MIME asas.
import { createServer, type Server } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";

const JENIS: Record<string, string> = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2" };

export async function pelayanStatik(akar: string): Promise<{ url: string; tutup(): Promise<void> }> {
  const srv: Server = createServer((q, s) => {
    let p = normalize(join(akar, decodeURIComponent(new URL(q.url ?? "/", "http://x").pathname)));
    if (existsSync(p) && statSync(p).isDirectory()) p = join(p, "index.html");
    if (!p.startsWith(akar) || !existsSync(p)) {
      s.writeHead(404).end();
      return;
    }
    s.writeHead(200, { "content-type": JENIS[extname(p)] ?? "application/octet-stream" }).end(readFileSync(p));
  });
  await new Promise<void>((r) => srv.listen(0, "127.0.0.1", r));
  const a = srv.address();
  const port = typeof a === "object" && a ? a.port : 0;
  return { url: `http://127.0.0.1:${port}/`, tutup: () => new Promise((r) => srv.close(() => r())) };
}
