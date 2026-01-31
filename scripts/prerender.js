import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '../dist');

const routes = [
    '/',
    '/frameworks/first-principles',
    '/frameworks/pareto',
    '/frameworks/rpm',
    '/frameworks/eisenhower',
    '/frameworks/okr',
    '/pricing',
    '/community'
];

async function prerender() {
    console.log('Starting prerender...');
    
    // Start preview server
    const preview = spawn('npm', ['run', 'preview'], {
        cwd: path.resolve(__dirname, '..'),
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe']
    });

    let baseUrl = '';

    try {
        await new Promise((resolve, reject) => {
            preview.stdout.on('data', (data) => {
                const output = data.toString();
                console.log(`Preview: ${output}`);
                // Match "Local: http://localhost:PORT/"
                const match = output.match(/Local:\s+(http:\/\/localhost:\d+)/);
                if (match) {
                    baseUrl = match[1];
                    console.log(`Server started at ${baseUrl}`);
                    resolve();
                }
            });

            preview.stderr.on('data', (data) => console.error(`Preview Err: ${data}`));
            
            preview.on('close', (code) => {
                if (code !== 0 && !baseUrl) reject(new Error(`Preview exited with code ${code}`));
            });

            // Timeout
            setTimeout(() => {
                if (!baseUrl) reject(new Error('Timeout waiting for preview server'));
            }, 30000);
        });

        console.log(`Prerendering against ${baseUrl}`);
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        for (const route of routes) {
            console.log(`Prerendering ${route}...`);
            try {
                await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle0', timeout: 30000 });
                
                // Allow some time for animations/mounting
                await new Promise(r => setTimeout(r, 1000));

                const html = await page.content();
                
                const relativePath = route === '/' ? 'index.html' : `${route.substring(1)}/index.html`;
                const fullPath = path.join(DIST_DIR, relativePath);
                const dir = path.dirname(fullPath);

                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
                
                fs.writeFileSync(fullPath, html);
                console.log(`Saved ${fullPath}`);
            } catch (e) {
                console.error(`Failed to prerender ${route}:`, e);
            }
        }

        await browser.close();
        console.log('Prerender complete.');

    } catch (e) {
        console.error('Prerender failed:', e);
    } finally {
        if (preview) {
             // On Windows, killing the process might require taskkill if using shell: true
             if (process.platform === 'win32') {
                 spawn("taskkill", ["/pid", preview.pid, '/f', '/t']);
             } else {
                 preview.kill();
             }
        }
    }
    process.exit(0);
}

prerender();
