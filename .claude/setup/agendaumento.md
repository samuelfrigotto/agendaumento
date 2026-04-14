# 🐾 Agenda de Banho e Tosa — Documento de Especificação Técnica

> Sistema SaaS de agendamento para banhistas autônomas e pet shops pequenos.  
> Stack: Node.js · Angular v17 · PostgreSQL · VPS (backend) · Vercel (frontend)

---

## 📌 Visão Geral do Produto

**Problema que resolve:** banhistas e tosadoras autônomas gerenciam tudo pelo WhatsApp pessoal, caderno ou memória. Esquecem de avisar o dono, perdem histórico de pets, não sabem quanto faturaram no mês.

**Usuários principais:**

- **Banhista/Tosadora** (usuária pagante) — usa o painel web todos os dias
- **Dono do pet** (usuário gratuito) — recebe avisos no WhatsApp, não precisa instalar nada

**Modelo de negócio:** R$29,90/mês por banhista. Teste grátis por 14 dias.

---

## 🏗️ Arquitetura Geral

```
┌─────────────────────────────────────────────────────────┐
│                    VERCEL (Frontend)                    │
│              Angular v17 SPA (Static Build)             │
│         app.agendabanhotosa.com.br                      │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS / REST API
┌──────────────────────▼──────────────────────────────────┐
│                    VPS (Backend)                        │
│              Node.js + Express (API REST)               │
│              Porta 3000 → Nginx reverse proxy           │
│              api.agendabanhotosa.com.br                 │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                  PostgreSQL (VPS)                       │
│              Banco local na mesma VPS                   │
│              Porta 5432 (sem exposição externa)         │
└─────────────────────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│             WhatsApp API (Evolution API)                │
│       Instância auto-hospedada na VPS ou                │
│       Z-API (serviço terceiro, ~R$70/mês)               │
└─────────────────────────────────────────────────────────┘
```

**Por que essa stack:**

- Angular v17 tem standalone components e signals — mais performático
- Node.js/Express é simples de manter na VPS e fácil de escalar
- PostgreSQL na mesma VPS elimina latência e custo adicional de DB remoto
- Vercel serve o frontend globalmente sem custo no plano free
- Evolution API é open source e pode rodar na mesma VPS (zero custo extra)

---

## 📁 Estrutura de Pastas

```
/projeto-raiz
├── /backend                  ← Node.js API
│   ├── /src
│   │   ├── /config
│   │   │   ├── database.js       ← conexão PostgreSQL (pg pool)
│   │   │   ├── env.js            ← variáveis de ambiente
│   │   │   └── whatsapp.js       ← configuração Evolution API / Z-API
│   │   ├── /middlewares
│   │   │   ├── auth.js           ← verificação JWT
│   │   │   └── errorHandler.js
│   │   ├── /modules
│   │   │   ├── /auth             ← login, registro, refresh token
│   │   │   ├── /banhistas        ← perfil, configurações da banhista
│   │   │   ├── /clientes         ← donos de pets
│   │   │   ├── /pets             ← cadastro de animais
│   │   │   ├── /agendamentos     ← core do sistema
│   │   │   ├── /financeiro       ← registros de pagamento
│   │   │   └── /whatsapp         ← envio de mensagens
│   │   └── server.js
│   ├── /migrations               ← arquivos SQL de criação das tabelas
│   ├── .env.example
│   └── package.json
│
├── /frontend                 ← Angular v17
│   ├── /src
│   │   ├── /app
│   │   │   ├── /core
│   │   │   │   ├── /guards       ← auth guard, role guard
│   │   │   │   ├── /interceptors ← JWT interceptor, error interceptor
│   │   │   │   └── /services     ← AuthService, ApiService
│   │   │   ├── /shared
│   │   │   │   ├── /components   ← componentes reutilizáveis
│   │   │   │   └── /pipes        ← formatação de data, moeda BR
│   │   │   ├── /features
│   │   │   │   ├── /auth         ← login, registro
│   │   │   │   ├── /agenda       ← tela principal (calendário)
│   │   │   │   ├── /pets         ← cadastro de pets
│   │   │   │   ├── /clientes     ← cadastro de donos
│   │   │   │   └── /financeiro   ← painel de receitas
│   │   │   └── app.routes.ts
│   │   ├── /environments
│   │   │   ├── environment.ts
│   │   │   └── environment.prod.ts
│   │   └── styles.scss           ← variáveis globais, tema
│   ├── vercel.json
│   └── package.json
```

---

## 🗄️ Banco de Dados — PostgreSQL

### Tabelas e relacionamentos

```sql
-- ===================================================
-- Migration 001: Tabela de Banhistas (usuárias do sistema)
-- ===================================================
CREATE TABLE banhistas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome            VARCHAR(150) NOT NULL,
  email           VARCHAR(255) UNIQUE NOT NULL,
  senha_hash      VARCHAR(255) NOT NULL,
  telefone        VARCHAR(20),
  nome_negocio    VARCHAR(200),          -- ex: "Pet Lindo da Maria"
  whatsapp_numero VARCHAR(20),           -- número vinculado à Evolution API
  plano           VARCHAR(20) DEFAULT 'trial',  -- 'trial', 'ativo', 'cancelado'
  trial_fim       TIMESTAMP,
  ativo           BOOLEAN DEFAULT true,
  criado_em       TIMESTAMP DEFAULT NOW(),
  atualizado_em   TIMESTAMP DEFAULT NOW()
);

-- ===================================================
-- Migration 002: Clientes (donos dos pets)
-- ===================================================
CREATE TABLE clientes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  banhista_id     UUID NOT NULL REFERENCES banhistas(id) ON DELETE CASCADE,
  nome            VARCHAR(150) NOT NULL,
  telefone        VARCHAR(20) NOT NULL,    -- número WhatsApp do dono
  email           VARCHAR(255),
  observacoes     TEXT,
  criado_em       TIMESTAMP DEFAULT NOW()
);

-- ===================================================
-- Migration 003: Pets
-- ===================================================
CREATE TABLE pets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id      UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  banhista_id     UUID NOT NULL REFERENCES banhistas(id) ON DELETE CASCADE,
  nome            VARCHAR(100) NOT NULL,
  especie         VARCHAR(50) DEFAULT 'cachorro',  -- cachorro, gato, etc
  raca            VARCHAR(100),
  tamanho         VARCHAR(20),   -- 'pequeno', 'medio', 'grande', 'gigante'
  peso_kg         DECIMAL(5,2),
  foto_url        VARCHAR(500),
  observacoes     TEXT,          -- morde, tem medo de secador, alérgico, etc
  criado_em       TIMESTAMP DEFAULT NOW()
);

-- ===================================================
-- Migration 004: Serviços (catálogo da banhista)
-- ===================================================
CREATE TABLE servicos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  banhista_id     UUID NOT NULL REFERENCES banhistas(id) ON DELETE CASCADE,
  nome            VARCHAR(150) NOT NULL,  -- "Banho", "Tosa", "Banho+Tosa"
  duracao_min     INTEGER NOT NULL,       -- duração em minutos
  preco_pequeno   DECIMAL(8,2),
  preco_medio     DECIMAL(8,2),
  preco_grande    DECIMAL(8,2),
  preco_gigante   DECIMAL(8,2),
  ativo           BOOLEAN DEFAULT true
);

-- ===================================================
-- Migration 005: Agendamentos (tabela central)
-- ===================================================
CREATE TABLE agendamentos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  banhista_id     UUID NOT NULL REFERENCES banhistas(id) ON DELETE CASCADE,
  pet_id          UUID NOT NULL REFERENCES pets(id),
  cliente_id      UUID NOT NULL REFERENCES clientes(id),
  servico_id      UUID REFERENCES servicos(id),
  data_hora       TIMESTAMP NOT NULL,
  duracao_min     INTEGER NOT NULL DEFAULT 60,
  preco           DECIMAL(8,2),
  status          VARCHAR(30) DEFAULT 'agendado',
  -- status: 'agendado' | 'confirmado' | 'em_andamento' | 'concluido' | 'cancelado'
  observacoes     TEXT,
  aviso_enviado   BOOLEAN DEFAULT false,  -- aviso de "pet pronto"
  foto_pronto_url VARCHAR(500),           -- foto do pet após o banho
  forma_pagamento VARCHAR(30),            -- 'pix', 'dinheiro', 'cartao', 'pendente'
  pago            BOOLEAN DEFAULT false,
  criado_em       TIMESTAMP DEFAULT NOW(),
  atualizado_em   TIMESTAMP DEFAULT NOW()
);

-- ===================================================
-- Migration 006: Mensagens WhatsApp (log)
-- ===================================================
CREATE TABLE mensagens_whatsapp (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  banhista_id     UUID NOT NULL REFERENCES banhistas(id),
  agendamento_id  UUID REFERENCES agendamentos(id),
  telefone_destino VARCHAR(20) NOT NULL,
  tipo            VARCHAR(50),  -- 'confirmacao', 'lembrete', 'pronto', 'custom'
  mensagem        TEXT NOT NULL,
  status          VARCHAR(20) DEFAULT 'enviado',  -- 'enviado', 'falhou'
  enviado_em      TIMESTAMP DEFAULT NOW()
);

-- ===================================================
-- Índices para performance
-- ===================================================
CREATE INDEX idx_agendamentos_banhista_data ON agendamentos(banhista_id, data_hora);
CREATE INDEX idx_agendamentos_status ON agendamentos(status);
CREATE INDEX idx_pets_cliente ON pets(cliente_id);
CREATE INDEX idx_clientes_banhista ON clientes(banhista_id);
```

---

## 🔌 API REST — Endpoints

### Autenticação

```
POST   /api/auth/registro          → criar conta banhista
POST   /api/auth/login             → login, retorna JWT
POST   /api/auth/refresh           → renovar token
POST   /api/auth/esqueci-senha     → enviar email de recuperação
```

### Banhista (perfil)

```
GET    /api/banhista/perfil        → dados da banhista logada
PUT    /api/banhista/perfil        → atualizar nome, telefone, negócio
PUT    /api/banhista/senha         → trocar senha
GET    /api/banhista/dashboard     → resumo: agendamentos hoje, semana, faturamento
```

### Clientes (donos de pets)

```
GET    /api/clientes               → listar todos (com paginação)
POST   /api/clientes               → criar cliente
GET    /api/clientes/:id           → detalhes + pets + histórico
PUT    /api/clientes/:id           → editar
DELETE /api/clientes/:id           → remover (soft delete)
```

### Pets

```
GET    /api/pets                   → listar todos os pets da banhista
POST   /api/pets                   → criar pet (com upload de foto)
GET    /api/pets/:id               → detalhes + histórico de agendamentos
PUT    /api/pets/:id               → editar
DELETE /api/pets/:id               → remover
POST   /api/pets/:id/foto          → upload de foto (multipart)
```

### Serviços

```
GET    /api/servicos               → listar serviços da banhista
POST   /api/servicos               → criar serviço
PUT    /api/servicos/:id           → editar
DELETE /api/servicos/:id           → desativar
```

### Agendamentos (core)

```
GET    /api/agendamentos           → listar (filtros: data, status, pet, cliente)
GET    /api/agendamentos/hoje      → agendamentos do dia atual
GET    /api/agendamentos/semana    → agendamentos da semana (para o calendário)
POST   /api/agendamentos           → criar agendamento
GET    /api/agendamentos/:id       → detalhes
PUT    /api/agendamentos/:id       → editar (data, serviço, preço)
PATCH  /api/agendamentos/:id/status → mudar status (agendado → concluido etc)
PATCH  /api/agendamentos/:id/pago  → marcar como pago
DELETE /api/agendamentos/:id       → cancelar
POST   /api/agendamentos/:id/avisar-pronto → envia WhatsApp "pet pronto"
POST   /api/agendamentos/:id/foto-pronto   → upload foto do pet finalizado
```

### Financeiro

```
GET    /api/financeiro/resumo      → faturamento do mês atual
GET    /api/financeiro/historico   → faturamento por mês (últimos 6 meses)
GET    /api/financeiro/pendentes   → agendamentos não pagos
```

### WhatsApp

```
POST   /api/whatsapp/enviar-custom → mensagem livre para um cliente
GET    /api/whatsapp/status        → verificar conexão da instância WhatsApp
```

---

## ⚙️ Backend — Node.js / Express

### Dependências principais (`package.json`)

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.3",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "sharp": "^0.33.2",
    "axios": "^1.6.5",
    "cors": "^2.8.5",
    "dotenv": "^16.4.1",
    "express-validator": "^7.0.1",
    "express-rate-limit": "^7.1.5",
    "helmet": "^7.1.0",
    "node-cron": "^3.0.3"
  },
  "devDependencies": {
    "nodemon": "^3.0.3"
  }
}
```

### Arquivo `.env.example`

```env
# Servidor
PORT=3000
NODE_ENV=production

# JWT
JWT_SECRET=coloque_um_secret_longo_aqui_minimo_32_chars
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Banco de Dados (PostgreSQL local na VPS)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=agendabanhotosa
DB_USER=postgres
DB_PASSWORD=sua_senha_forte_aqui

# WhatsApp (Evolution API — hospedada na VPS)
WHATSAPP_API_URL=http://localhost:8080
WHATSAPP_API_KEY=sua_api_key_evolution

# OU Z-API (serviço externo)
# ZAPI_INSTANCE=sua_instancia
# ZAPI_TOKEN=seu_token
# ZAPI_CLIENT_TOKEN=seu_client_token

# Upload de arquivos
UPLOAD_PATH=/var/www/uploads/banhotosa
MAX_FILE_SIZE_MB=5

# Frontend (para CORS)
FRONTEND_URL=https://app.agendabanhotosa.com.br

# Email (opcional, para recuperação de senha)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu@email.com
SMTP_PASS=senha_app_google
```

### Padrão de módulo (exemplo: agendamentos)

```
/modules/agendamentos/
├── agendamentos.routes.js      ← define as rotas
├── agendamentos.controller.js  ← recebe req/res, chama service
├── agendamentos.service.js     ← lógica de negócio, queries SQL
└── agendamentos.validator.js   ← validações com express-validator
```

### Autenticação JWT

- Token de acesso: expira em 7 dias
- Refresh token: expira em 30 dias, salvo em cookie HttpOnly
- Middleware `auth.js` valida o Bearer token em todas as rotas protegidas
- Toda query SQL filtra por `banhista_id` do token para isolar dados

### Upload de fotos

- `multer` recebe a imagem em memória
- `sharp` redimensiona para 800x800px máximo e converte para webp
- Salva no diretório `/var/www/uploads/banhotosa/{banhista_id}/`
- Nginx serve os arquivos estáticos de uploads via `/uploads/` path
- Para escalar no futuro: trocar por Cloudflare R2 ou S3

### CRON Jobs (`node-cron`)

```
Todos os dias às 08:00 →
  Busca agendamentos do dia com WhatsApp não enviado
  Envia mensagem de lembrete para o dono do pet

Todos os dias às 09:00 →
  Busca banhistas no último dia do trial
  Envia aviso de expiração (email ou WhatsApp)
```

---

## 🎨 Frontend — Angular v17

### Dependências principais (`package.json`)

```json
{
  "dependencies": {
    "@angular/core": "^17.0.0",
    "@angular/router": "^17.0.0",
    "@angular/forms": "^17.0.0",
    "@angular/common": "^17.0.0",
    "rxjs": "^7.8.0",
    "date-fns": "^3.3.1",
    "date-fns-tz": "^3.1.3"
  }
}
```

> **Importante:** usar apenas Angular puro + date-fns. Não usar Angular Material nem PrimeNG — o design será customizado do zero para ter identidade visual própria, não parecer sistema genérico.

### Variáveis de ambiente

```typescript
// environment.prod.ts
export const environment = {
  production: true,
  apiUrl: "https://api.agendabanhotosa.com.br/api",
};
```

### Rotas principais (`app.routes.ts`)

```typescript
const routes: Routes = [
  { path: "", redirectTo: "/agenda", pathMatch: "full" },
  {
    path: "login",
    loadComponent: () => import("./features/auth/login/login.component"),
  },
  {
    path: "registro",
    loadComponent: () => import("./features/auth/registro/registro.component"),
  },
  {
    path: "",
    component: LayoutComponent, // shell com sidebar
    canActivate: [authGuard],
    children: [
      {
        path: "agenda",
        loadComponent: () => import("./features/agenda/agenda.component"),
      },
      {
        path: "clientes",
        loadComponent: () => import("./features/clientes/clientes.component"),
      },
      {
        path: "pets",
        loadComponent: () => import("./features/pets/pets.component"),
      },
      {
        path: "financeiro",
        loadComponent: () =>
          import("./features/financeiro/financeiro.component"),
      },
      {
        path: "configuracoes",
        loadComponent: () =>
          import("./features/configuracoes/configuracoes.component"),
      },
    ],
  },
];
```

### Identidade visual — Design System

```scss
// styles.scss — variáveis globais

:root {
  // Paleta: warm & friendly (pet shop vibe, não fria/corporativa)
  --cor-primaria: #ff6b35; // laranja vibrante
  --cor-primaria-hover: #e55a26;
  --cor-secundaria: #4ecdc4; // teal/menta
  --cor-fundo: #fff8f5; // off-white quente
  --cor-fundo-card: #ffffff;
  --cor-texto: #2d2926; // marrom quase preto
  --cor-texto-suave: #8b7e75;
  --cor-borda: #ede0d8;
  --cor-sucesso: #52b788;
  --cor-alerta: #ffb703;
  --cor-erro: #e63946;

  // Status dos agendamentos
  --status-agendado: #b8d4e8;
  --status-confirmado: #4ecdc4;
  --status-em-andamento: #ffb703;
  --status-concluido: #52b788;
  --status-cancelado: #ede0d8;

  // Tipografia
  --fonte-titulo: "Nunito", sans-serif; // rounded, amigável
  --fonte-corpo: "DM Sans", sans-serif; // legível, moderno

  // Espaçamento
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 20px;
  --sombra-card: 0 2px 12px rgba(45, 41, 38, 0.08);
}
```

---

## 📱 Telas do Sistema — Especificação Funcional

### 1. Login / Registro

- Formulário simples: email + senha
- Link "Criar conta grátis por 14 dias"
- Registro pede: nome, nome do negócio, email, senha, telefone
- Após registro: redireciona para onboarding rápido (criar primeiro serviço)

---

### 2. Agenda (tela principal)

**Esta é a tela mais importante — deve ser perfeita.**

Layout:

```
┌────────────────────────────────────────────────────────┐
│  [◄] Seg 13/04          [HOJE]          [►]            │
│  + Novo Agendamento                                     │
├────────┬────────┬────────┬────────┬────────┬────────┬──┤
│  SEG   │  TER   │  QUA   │  QUI   │  SEX   │  SÁB   │DOM│
│  13/04 │  14/04 │  15/04 │  16/04 │  17/04 │  18/04 │...│
├────────┼────────┼────────┼────────┼────────┼────────┼──┤
│ 08:00  │        │        │        │        │        │   │
│ ┌────┐ │        │        │ ┌────┐ │        │        │   │
│ │Bolt│ │        │        │ │Mel │ │        │        │   │
│ │B+T │ │        │        │ │Bnh │ │        │        │   │
│ │R$80│ │        │        │ │R$50│ │        │        │   │
│ └────┘ │        │        │ └────┘ │        │        │   │
│ 09:00  │ ┌────┐ │        │        │        │        │   │
│        │ │Nala│ │        │        │        │        │   │
│        │ │Tosa│ │        │        │        │        │   │
│        │ │R$90│ │        │        │        │        │   │
│        │ └────┘ │        │        │        │        │   │
└────────┴────────┴────────┴────────┴────────┴────────┴──┘
```

Cada card de agendamento exibe:

- Nome do pet (em destaque)
- Tipo de serviço
- Preço
- Cor de fundo conforme status
- Ícone de WhatsApp (envia mensagem rápida)

Ao clicar no card, abre modal com:

- Dados completos do agendamento
- Dados do pet (foto, observações)
- Dados do dono (nome, telefone)
- Botões de ação: Iniciar atendimento / Concluir / Cancelar
- Botão "Pet tá pronto!" → envia WhatsApp + abre câmera para foto

Ao clicar em "+ Novo Agendamento" abre modal com:

- Campo de busca de cliente (autocomplete)
- Campo de busca de pet (carrega os pets do cliente)
- Data e hora (datepicker)
- Serviço (dropdown com preço preenchido automaticamente por tamanho do pet)
- Preço (editável)
- Observações
- Botão Salvar (salva e opcionalmente envia confirmação WhatsApp)

---

### 3. Clientes

Lista em tabela com:

- Nome do dono
- Telefone (link direto para WhatsApp)
- Quantidade de pets
- Último agendamento
- Ações: Ver detalhes / Editar / Novo agendamento

Tela de detalhe do cliente:

- Dados pessoais
- Lista de pets com foto
- Histórico de agendamentos

---

### 4. Pets

Lista de cards visuais (não tabela — mais amigável):

```
┌──────────────────────┐
│  [foto do pet]       │
│  🐕 Bolt             │
│  Golden, Grande      │
│  Dono: João Silva    │
│  ⚠️ Morde estranhos  │
│  Último: 15/03/2026  │
└──────────────────────┘
```

Cadastro de pet:

- Nome, espécie, raça, tamanho, peso
- Foto (upload com preview)
- Observações (campo livre — campo mais importante!)
- Vínculo com cliente (autocomplete)

---

### 5. Financeiro

Dashboard simples:

```
┌─────────────────────────────────────────┐
│  ABRIL 2026                             │
│  Faturado: R$ 2.840,00 ✅               │
│  A receber: R$ 420,00 ⏳                │
│  Total agendamentos: 47                 │
└─────────────────────────────────────────┘

Últimos 6 meses (gráfico de barras simples)
Nov  Dez  Jan  Fev  Mar  Abr
█    ██   ███  ███  ████ ████

Pendentes de pagamento:
┌─────────────────────────────────────────┐
│ Nala — Tosa — 12/04 — R$90 [Marcar pago]│
│ Bob  — B+T  — 13/04 — R$80 [Marcar pago]│
└─────────────────────────────────────────┘
```

---

### 6. Configurações

- Dados do negócio (nome, foto de perfil)
- Serviços (criar/editar/remover serviços e preços por tamanho)
- Horário de funcionamento (dias da semana + horário início/fim)
- Configuração do WhatsApp (conectar instância)
- Mensagens automáticas (editar o texto dos templates)
- Conta e assinatura

---

## 📲 Integração WhatsApp

### Templates de mensagem (editáveis pela banhista)

**Confirmação de agendamento:**

```
Olá {{nome_dono}}! 🐾
Seu agendamento para o {{nome_pet}} está confirmado!

📅 Data: {{data_hora}}
✂️ Serviço: {{servico}}
💰 Valor: R$ {{preco}}

Qualquer dúvida, é só chamar!
— {{nome_negocio}}
```

**Lembrete (dia anterior):**

```
Oi {{nome_dono}}, tudo bem? 😊
Lembrando que amanhã o {{nome_pet}} tem banho aqui com a gente!

⏰ Horário: {{hora}}

Nos vemos amanhã! 🐶
```

**Pet pronto para buscar:**

```
{{nome_dono}}, o {{nome_pet}} tá lindo e pronto pra ir pra casa! 🎉🐾

Pode vir buscar quando quiser.
{{#foto}}[foto em anexo]{{/foto}}

Obrigada pela preferência! 💛
— {{nome_negocio}}
```

### Implementação (Evolution API na VPS)

A Evolution API é um servidor WhatsApp auto-hospedado open source.

```javascript
// whatsapp.service.js
const axios = require("axios");

const EVOLUTION_URL = process.env.WHATSAPP_API_URL;
const EVOLUTION_KEY = process.env.WHATSAPP_API_KEY;

async function enviarMensagem(telefone, mensagem, imagemUrl = null) {
  // Formatar número BR: 55 + DDD + número
  const numeroFormatado = formatarTelefone(telefone);

  if (imagemUrl) {
    // Envia imagem com legenda
    await axios.post(
      `${EVOLUTION_URL}/message/sendMedia/banhotosa`,
      {
        number: numeroFormatado,
        mediatype: "image",
        media: imagemUrl,
        caption: mensagem,
      },
      {
        headers: { apikey: EVOLUTION_KEY },
      },
    );
  } else {
    // Envia texto
    await axios.post(
      `${EVOLUTION_URL}/message/sendText/banhotosa`,
      {
        number: numeroFormatado,
        text: mensagem,
      },
      {
        headers: { apikey: EVOLUTION_KEY },
      },
    );
  }
}

function formatarTelefone(tel) {
  // Remove tudo que não é número
  const numeros = tel.replace(/\D/g, "");
  // Garante código do país 55
  if (numeros.startsWith("55")) return `${numeros}@s.whatsapp.net`;
  return `55${numeros}@s.whatsapp.net`;
}
```

> **⚠️ Importante:** a Evolution API precisa de um número de WhatsApp exclusivo para o sistema. A banhista não poderá usar o mesmo número para atendimento pessoal. Recomenda-se um chip de operadora dedicado ou número virtual.

---

## 🔒 Segurança

- **Senhas:** bcrypt com salt rounds 12
- **JWT:** secret forte, expiração curta, refresh via cookie HttpOnly
- **CORS:** apenas o domínio do frontend
- **Rate Limiting:** express-rate-limit (100 req/15min por IP)
- **Helmet:** headers de segurança HTTP
- **Validação:** express-validator em todos os endpoints
- **SQL:** nunca concatenar strings — usar sempre parâmetros ($1, $2) do pg
- **Uploads:** validar mime type + tamanho, nunca executar arquivos
- **Multi-tenant:** todo query filtra por `banhista_id` do JWT, sem exceção

---

## 🚀 Deploy

### Backend (VPS)

```bash
# Na VPS, depois de clonar o repositório:
cd /var/www/banhotosa/backend
npm install --production
cp .env.example .env
# Editar .env com as credenciais reais

# Rodar migrations
node src/database/migrate.js

# Iniciar com PM2
pm2 start src/server.js --name banhotosa-api
pm2 save
pm2 startup

# Nginx: criar virtual host apontando porta 3000
# Ver .md da VPS para configuração do Nginx
```

### Frontend (Vercel)

```json
// vercel.json (na raiz do /frontend)
{
  "buildCommand": "npm run build -- --configuration production",
  "outputDirectory": "dist/frontend/browser",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

```bash
# Conectar repositório GitHub ao Vercel
# Definir variável de ambiente no painel Vercel:
# VITE_API_URL = https://api.agendabanhotosa.com.br/api

# Vercel faz deploy automático a cada push na branch main
```

---

## 🧩 Ordem de Desenvolvimento Recomendada

Siga essa sequência para ter algo funcional o mais rápido possível:

```
SEMANA 1 — Base funcional
  [x] 1. Setup banco PostgreSQL + migrations
  [x] 2. API: auth (registro/login/JWT)
  [x] 3. Frontend: tela de login e registro
  [x] 4. API: CRUD de clientes e pets
  [x] 5. Frontend: telas de clientes e pets

SEMANA 2 — Core do produto
  [x] 6. API: CRUD de agendamentos
  [x] 7. Frontend: agenda semanal (calendário visual)
  [x] 8. Frontend: modal de criação/edição de agendamento
  [x] 9. API: upload de fotos de pets
  [x] 10. Frontend: cards de pet com foto

SEMANA 3 — WhatsApp + Financeiro
  [x] 11. Setup Evolution API na VPS
  [x] 12. API: envio de mensagens WhatsApp
  [x] 13. Integração "Pet tá pronto!" com foto
  [x] 14. Frontend: tela financeiro
  [x] 15. CRON: lembrete automático do dia anterior

SEMANA 4 — Polimento e lançamento
  [x] 16. Frontend: configurações e serviços
  [x] 17. Onboarding do novo usuário
  [x] 18. Testes com banhista real (Toledo)
  [x] 19. Ajustes de UX baseados no feedback
  [x] 20. Deploy final + domínio + SSL
```

---

## 📋 Prompt para o Claude Code

Use este prompt ao iniciar cada sessão no Claude Code:

```
Estou construindo um sistema SaaS de agenda para banho e tosa de pets.

Stack:
- Backend: Node.js + Express na VPS (Ubuntu)
- Frontend: Angular v17 (standalone components, signals)
- Banco: PostgreSQL local na VPS
- Deploy frontend: Vercel

Contexto do projeto:
- É um sistema multi-tenant: cada banhista tem seus próprios dados isolados por banhista_id
- O JWT carrega o banhista_id e todas as queries filtram por ele
- Não usar ORM (usar pg diretamente com queries parametrizadas)
- Angular sem Angular Material — CSS customizado com variáveis CSS
- WhatsApp via Evolution API (open source, auto-hospedada)

Agora me ajude a implementar: [DESCREVA A FEATURE ESPECÍFICA]

Sempre que criar um arquivo novo, mostre o caminho completo.
Sempre que criar uma query SQL, use parâmetros ($1, $2) nunca concatenação.
Siga o padrão de módulos: routes → controller → service → validator.
```

---

## 💰 Custos de Operação Estimados

| Item                   | Custo                          |
| ---------------------- | ------------------------------ |
| VPS (já existente)     | R$0 (já pago)                  |
| Vercel (frontend)      | R$0 (plano free)               |
| Evolution API          | R$0 (open source, roda na VPS) |
| Chip WhatsApp dedicado | ~R$30/mês (SIM card)           |
| Domínio (.com.br)      | ~R$40/ano                      |
| SSL (Let's Encrypt)    | R$0                            |
| **Total mensal**       | **~R$30/mês**                  |

Com o primeiro cliente pagando R$29,90/mês, o sistema já se paga.  
Com 10 clientes = R$299/mês de receita com ~R$30 de custo.

---

_Documento gerado em: abril de 2026_
_Versão: 1.0_
