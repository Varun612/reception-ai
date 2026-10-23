import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRouter from './routes/auth.js';
import tenantsRouter from './routes/tenants.js';
import appointmentsRouter from './routes/appointments.js';
import servicesRouter from './routes/services.js';
import staffRouter from './routes/staff.js';
import agentRouter from './routes/agent.js';
import widgetRouter from './routes/widget.js';
import billingRouter from './routes/billing.js';
import adminRouter from './routes/admin.js';
import telephonyRouter from './routes/telephony.js';

export const app = express();

// Middlewares
app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json());

// Public Embeddable Widget Script Endpoint
app.get('/widget.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  const serverHost = `${req.protocol}://${req.get('host')}`;
  res.send(`
(function() {
  const scriptTag = document.currentScript;
  const tenantSlug = scriptTag ? scriptTag.getAttribute('data-tenant') : '';
  if (!tenantSlug) {
    console.error('[ReceptionAI Widget] Missing data-tenant attribute.');
    return;
  }

  // Inject Widget Styles
  const style = document.createElement('style');
  style.innerHTML = \`
    .reception-ai-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #7e22ce, #9333ea);
      box-shadow: 0 10px 25px -5px rgba(126, 34, 206, 0.4);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .reception-ai-btn:hover {
      transform: scale(1.06);
      box-shadow: 0 14px 28px -4px rgba(126, 34, 206, 0.5);
    }
    .reception-ai-frame-container {
      position: fixed;
      bottom: 96px;
      right: 24px;
      width: 400px;
      height: 620px;
      max-width: calc(100vw - 32px);
      max-height: calc(100vh - 120px);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
      z-index: 999999;
      display: none;
      background: #ffffff;
      border: 1px solid #e2e8f0;
    }
  \`;
  document.head.appendChild(style);

  // Inject Launcher Button
  const btn = document.createElement('div');
  btn.className = 'reception-ai-btn';
  btn.innerHTML = \`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path><circle cx="18" cy="5" r="3"></circle></svg>\`;
  document.body.appendChild(btn);

  // Inject Chat Modal Container
  const container = document.createElement('div');
  container.className = 'reception-ai-frame-container';
  const iframe = document.createElement('iframe');
  iframe.src = '${config.clientUrl}/embed/' + tenantSlug;
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';
  container.appendChild(iframe);
  document.body.appendChild(container);

  let isOpen = false;
  btn.addEventListener('click', () => {
    isOpen = !isOpen;
    container.style.display = isOpen ? 'block' : 'none';
  });
})();
  `);
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/tenants', tenantsRouter);
app.use('/api/tenants', appointmentsRouter);
app.use('/api/tenants', servicesRouter);
app.use('/api/tenants', staffRouter);
app.use('/api/tenants', agentRouter);
app.use('/api/tenants', billingRouter);
app.use('/api/billing', billingRouter);
app.use('/api/widget', widgetRouter);
app.use('/api/admin', adminRouter);
app.use('/api/telephony', telephonyRouter);
app.use('/api/tenants', telephonyRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ReceptionAI Multi-Tenant API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    console.log(`[ReceptionAI Server] Listening on port ${config.port} in ${config.nodeEnv} mode`);
    console.log(`[ReceptionAI Server] Database URL: ${process.env.DATABASE_URL}`);
  });
}
