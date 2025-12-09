# CARA E-Commerce Platform

Plataforma B2B de e-commerce para produtos de ácido hialurónico de grau médico (preenchedores dérmicos) destinada a profissionais de saúde em Portugal.

## Requisitos

- Node.js 20+
- PostgreSQL 14+
- npm ou yarn

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

### Obrigatórias

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DATABASE_URL` | URL de conexão PostgreSQL | `postgresql://user:password@host:5432/database` |
| `SESSION_SECRET` | Chave secreta para sessões (mínimo 32 caracteres) | `sua-chave-secreta-muito-longa-aqui` |

### Opcionais (para o Seed)

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `ADMIN_EMAIL` | Email do administrador | `admin@cara.pt` |
| `ADMIN_PASSWORD` | Senha do administrador | `admin123` |
| `ADMIN_FIRST_NAME` | Primeiro nome do admin | `Administrador` |
| `ADMIN_LAST_NAME` | Sobrenome do admin | `CARA` |

### Opcionais (PayPal)

| Variável | Descrição |
|----------|-----------|
| `PAYPAL_CLIENT_ID` | ID do cliente PayPal |
| `PAYPAL_CLIENT_SECRET` | Segredo do cliente PayPal |

## Instalação

```bash
# Instalar dependências
npm install

# Sincronizar base de dados
npm run db:push

# Executar seed (criar admin e dados iniciais)
npx tsx scripts/seed.ts

# Iniciar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Iniciar em produção
npm run start
```

## Seed da Base de Dados

O script de seed (`scripts/seed.ts`) cria:

1. **Usuário Administrador**: Com acesso ao painel admin
2. **Produtos de Exemplo**: CARA Light, CARA Medium, CARA Deep
3. **Opções de Envio**: Standard, Expresso e Grátis
4. **Configurações PayPal**: Inicializadas em modo sandbox

### Executar o Seed

```bash
# Com variáveis padrão
npx tsx scripts/seed.ts

# Com variáveis personalizadas
ADMIN_EMAIL=seu@email.com ADMIN_PASSWORD=senha123 npx tsx scripts/seed.ts
```

### Credenciais Padrão do Admin

- **Email**: `admin@cara.pt`
- **Senha**: `admin123`

> **IMPORTANTE**: Altere estas credenciais em produção!

## Deploy no Coolify

### 1. Configurar o Repositório

Certifique-se de que o `Dockerfile` está na raiz do projeto.

### 2. Criar Aplicação no Coolify

1. Adicione uma nova aplicação Docker
2. Configure o repositório Git
3. Defina as variáveis de ambiente:
   - `DATABASE_URL`
   - `SESSION_SECRET`
   - `ADMIN_EMAIL` (opcional)
   - `ADMIN_PASSWORD` (opcional)

### 3. Configurar Base de Dados

1. Crie um serviço PostgreSQL no Coolify
2. Copie a URL de conexão para `DATABASE_URL`

### 4. Deploy

O Coolify irá:
1. Construir a imagem Docker
2. Iniciar o container na porta 5000
3. Aplicar health checks

### 5. Após o Deploy

Conecte-se ao container e execute:

```bash
# Sincronizar schema da base de dados
npm run db:push

# Executar seed
npx tsx scripts/seed.ts
```

## Estrutura do Projeto

```
├── client/              # Frontend React
│   ├── src/
│   │   ├── components/  # Componentes reutilizáveis
│   │   ├── pages/       # Páginas da aplicação
│   │   ├── hooks/       # Custom hooks
│   │   └── lib/         # Utilitários
│   └── public/          # Arquivos estáticos
├── server/              # Backend Express
│   ├── routes.ts        # Rotas da API
│   ├── storage.ts       # Interface de armazenamento
│   └── db.ts            # Conexão com base de dados
├── shared/              # Código compartilhado
│   └── schema.ts        # Schema Drizzle ORM
├── scripts/             # Scripts utilitários
│   └── seed.ts          # Script de seed
├── Dockerfile           # Configuração Docker
└── README.md            # Este arquivo
```

## Funcionalidades

- **Sistema de Aprovação**: Profissionais médicos precisam ser verificados antes de aceder ao catálogo
- **Painel Admin**: Gestão completa de usuários, produtos, pedidos e configurações
- **Carrinho de Compras**: Sistema completo com promoções por quantidade
- **Integração PayPal**: Pagamentos seguros via PayPal
- **Tema Claro/Escuro**: Suporte a preferências de tema do usuário

## Suporte

Para questões ou suporte, contacte através do formulário de contacto na plataforma.
