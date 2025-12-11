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

### Opcionais (Email SMTP)

Para ativar o envio de emails (recuperação de senha, confirmações de pedido, etc.):

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `SMTP_HOST` | Servidor SMTP | `smtp.gmail.com` |
| `SMTP_PORT` | Porta do servidor | `587` (TLS) ou `465` (SSL) |
| `SMTP_USER` | Email de autenticação | `seuemail@gmail.com` |
| `SMTP_PASS` | Senha ou App Password | `sua-senha-de-app` |
| `SMTP_FROM` | Email remetente | `CARA <noreply@cara.pt>` |

**Nota para Gmail**: Use uma "Senha de App" em vez da senha normal. Acesse Google Account > Segurança > Senhas de app para criar uma.

**Provedores recomendados**:
- Gmail (gratuito, limite de 500 emails/dia)
- SendGrid (100 emails/dia grátis)
- Mailgun (5.000 emails/mês grátis)
- Amazon SES (62.000 emails/mês grátis com AWS)

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

O script de seed (`scripts/seed.ts`) executa automaticamente as migrações necessárias e cria:

1. **Migrações**: Adiciona a coluna `category` se não existir
2. **Usuário Administrador**: Com acesso ao painel admin
3. **Produtos de Exemplo**: CARA Soft, CARA Mild, CARA Hard, CARA Ultra (com categorias)
4. **Opções de Envio**: Standard, Expresso e Grátis
5. **Configurações PayPal**: Inicializadas em modo sandbox

### Executar o Seed

```bash
# Com variáveis padrão
npx tsx scripts/seed.ts

# Com variáveis personalizadas
ADMIN_EMAIL=seu@email.com ADMIN_PASSWORD=senha123 npx tsx scripts/seed.ts
```

### Migração Manual (Produção)

Se precisar executar migrações manualmente no banco de produção (sem usar o seed), acesse o painel de Database e execute:

```sql
-- Adicionar coluna category aos produtos (se não existir)
ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR;
```

### Categorias de Produtos

Os produtos usam 4 categorias:
- **soft**: Rugas superficiais e hidratação
- **mild**: Rugas moderadas e volume
- **hard**: Rugas profundas e contorno
- **ultra**: Volumização máxima

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
npx drizzle-kit push

# Executar seed
npx tsx scripts/seed.ts
```

**Nota**: O Dockerfile instala todas as dependências para permitir executar migrações e seeds no container.

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
