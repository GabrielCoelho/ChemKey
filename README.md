# ChemKey - Your Local Password Manager

> A private password manager that keeps your digital keys secure and local.

ChemKey é um gerenciador de senhas local desenvolvido com foco em segurança e privacidade. Mantém seus dados criptografados localmente, sem dependência de serviços em nuvem.

## 🚀 Tecnologias Utilizadas

### Backend

- **Node.js** - Runtime JavaScript
- **TypeScript** - Tipagem estática e desenvolvimento robusto
- **Express.js** - Framework web para APIs REST
- **Sequelize** - ORM para banco de dados
- **SQLite** - Banco de dados local
- **bcrypt** - Hash seguro de senhas
- **crypto** - Criptografia AES-256-GCM para senhas

### Frontend

- **EJS** - Template engine para renderização server-side
- **Bootstrap 5** - Framework CSS responsivo
- **Font Awesome** - Ícones
- **JavaScript vanilla** - Interatividade do cliente

### Segurança

- **AES-256-GCM** - Criptografia de senhas
- **scrypt** - Derivação de chaves mestras
- **express-session** - Gerenciamento de sessões
- **helmet** - Headers de segurança
- **express-rate-limit** - Proteção contra força bruta

## 📋 Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn como gerenciador de pacotes

## 🛠️ Instalação e Configuração

### 1. Clone o repositório

```bash
git clone https://github.com/GabrielCoelho/ChemKey.git
cd ChemKey
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
# Environment
NODE_ENV=development

# Server
PORT=3000

# Database
DB_PATH=./data/chemkey.db
DB_LOGGING=false


# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5
```

### 4. Execute as migrações do banco de dados

```bash
npm run db:migrate
```

### 5. Compile o TypeScript (para produção)

```bash
npm run build
```

## 🚀 Executando o Projeto

### Desenvolvimento

```bash
npm run dev
```

### Produção

```bash
npm run build
npm start
```

O servidor estará disponível em `http://localhost:3000`

## 🔐 Criação de Novas Contas

### Requisitos de Senha

Para garantir a segurança da sua conta, as senhas devem atender aos seguintes critérios:

- **Mínimo 8 caracteres**
- **Pelo menos 1 letra maiúscula** (A-Z)
- **Pelo menos 1 letra minúscula** (a-z)
- **Pelo menos 1 número** (0-9)
- **Pelo menos 1 caractere especial** (!@#$%^&*()_+-=[]{}|;:,.<>?)

### Processo de Criação

1. Acesse `/register` ou clique em "Create Account" na página de login
2. Preencha os campos obrigatórios:
   - **Nome completo**: Para personalização da interface
   - **Email**: Será usado como login (formato flexível aceito)
   - **Senha**: Seguindo os requisitos de segurança
   - **Confirmação de senha**: Deve ser idêntica à senha
3. Aceite os termos de serviço
4. Clique em "Create Account"

### Segurança da Conta

- **Master Key**: Uma chave mestra é derivada automaticamente da sua senha usando scrypt
- **Criptografia Local**: Todas as senhas são criptografadas localmente com AES-256-GCM
- **Zero Knowledge**: Nem mesmo o servidor pode acessar suas senhas descriptografadas

## 📁 Estrutura do Projeto

```
ChemKey/
├── src/                        # Código fonte TypeScript
│   ├── config/                 # Configurações (banco, servidor)
│   ├── controllers/            # Controladores da API
│   ├── entities/               # Modelos do banco de dados
│   ├── middleware/             # Middlewares customizados
│   ├── routes/                 # Definição de rotas
│   ├── services/               # Serviços (criptografia, etc.)
│   └── index.ts               # Entry point da aplicação
├── views/                      # Templates EJS
│   ├── layouts/               # Layouts base
│   ├── pages/                 # Páginas principais
│   ├── partials/              # Componentes reutilizáveis
│   └── src/                   # Assets (CSS, JS, imagens)
├── migrations/                 # Migrações do banco de dados
├── data/                      # Banco SQLite (criado automaticamente)
├── dist/                      # JavaScript compilado (produção)
└── package.json               # Dependências e scripts
```

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento com hot-reload
npm run dev

# Build para produção
npm run build

# Executar versão compilada
npm start

# Migrações do banco
npm run db:migrate
npm run db:migrate:undo
npm run db:migrate:status
npm run db:reset
```

## ✨ Funcionalidades

### 🔐 Gerenciamento de Senhas

- **Adicionar senhas**: Com categorização e notas
- **Editar/excluir**: Controle completo dos dados
- **Busca e filtros**: Por categoria, site ou usuário
- **Favoritos**: Marque senhas importantes
- **Cópia segura**: Um clique para copiar senhas

### 🎲 Gerador de Senhas

- **Personalização completa**: Tamanho, tipos de caracteres
- **Análise de força**: Indicador visual de segurança
- **Geração standalone**: Use sem salvar no vault

### 💊 Análise de Saúde

- **Score geral**: Pontuação da segurança do vault
- **Detecção de problemas**: Senhas fracas, duplicadas, antigas
- **Recomendações**: Sugestões personalizadas de melhoria
- **Métricas visuais**: Dashboard com estatísticas

### 🛡️ Segurança

- **Criptografia local**: AES-256-GCM para cada senha
- **Autenticação robusta**: Hash bcrypt + rate limiting
- **Proteção de sessão**: Timeouts e invalidação automática
- **Headers de segurança**: Helmet.js para proteção adicional

## 🔒 Considerações de Segurança

### Arquitetura de Segurança

- **Criptografia E2E**: Dados nunca trafegam descriptografados
- **Master Key**: Derivada da senha do usuário, não armazenada em texto claro
- **Sal único**: Cada senha tem seu próprio salt criptográfico
- **Autenticação adicional**: Tag GCM para integridade dos dados

### Boas Práticas Implementadas

- **Validação rigorosa**: Todas as entradas são sanitizadas
- **Rate limiting**: Proteção contra ataques de força bruta
- **Timeouts de sessão**: Logout automático por inatividade
- **Logs de segurança**: Monitoramento de tentativas de acesso

### Recomendações de Uso

1. **Use uma senha mestra forte** seguindo os requisitos
2. **Mantenha backups** do arquivo de banco (`data/chemkey.db`)
3. **Execute em ambiente controlado** (não em máquinas compartilhadas)
4. **Atualize regularmente** as dependências do projeto

## 📚 Documentação Adicional

### APIs Disponíveis

#### Rotas Públicas

- `GET /` - Página inicial
- `GET /login` - Página de login
- `GET /register` - Página de registro
- `GET /health` - Health check da aplicação

#### Rotas de Autenticação

- `POST /auth/login` - Autenticação de usuário
- `POST /auth/register` - Registro de novo usuário
- `POST /auth/logout` - Logout do usuário
- `GET /auth/check` - Verificação de status de autenticação
- `POST /auth/change-password` - Alteração de senha (autenticado)

#### Rotas Protegidas (Requerem Autenticação)

- `GET /app` - Interface principal da aplicação
- `GET /passwords` - Listar todas as senhas do usuário
- `POST /passwords` - Criar nova senha
- `GET /passwords/:id` - Buscar senha específica
- `PUT /passwords/:id` - Atualizar senha existente
- `DELETE /passwords/:id` - Deletar senha
- `GET /passwords/favorites` - Listar senhas favoritas
- `POST /passwords/generate` - Gerar senha aleatória

#### Rotas de Análise de Saúde

- `GET /passwords/health` - Análise completa de saúde das senhas
- `GET /passwords/health/duplicates` - Buscar senhas duplicadas
- `GET /passwords/health/weak` - Buscar senhas fracas
- `GET /passwords/health/old` - Buscar senhas antigas (90+ dias)

### Configuração de Desenvolvimento

O projeto está configurado para desenvolvimento acadêmico com:

- **Validações flexibilizadas** em modo desenvolvimento
- **Logs detalhados** para debug e análise
- **Hot-reload** automático com nodemon
- **Tratamento de erros** abrangente e informativo
- **Rate limiting relaxado** para facilitar testes

### Estrutura de Banco de Dados

#### Tabela `users`

- `id` - Chave primária
- `name` - Nome completo do usuário
- `email` - Email (único, usado como login)
- `password_hash` - Hash bcrypt da senha
- `master_key` - Chave mestra derivada (criptografada)
- `last_login_at` - Último acesso
- `created_at` / `updated_at` - Timestamps

#### Tabela `passwords`

- `id` - Chave primária
- `user_id` - Referência ao usuário (FK)
- `website` - Site/serviço da senha
- `username` - Usuário/email do site
- `encrypted_password` - Senha criptografada (JSON)
- `category` - Categoria da senha
- `notes` - Notas adicionais
- `favorite` - Marcador de favorito
- `strength` - Força da senha (0-5)
- `last_used_at` - Último uso
- `created_at` / `updated_at` - Timestamps

## 🧪 Testes e Debugging

### Rotas de Teste

- `GET /test-404` - Força erro 404 para testar página
- `GET /test-error` - Força erro 500 para testar tratamento
- `GET /force-404` - Rota específica para teste de 404
- `GET /force-error` - Simula erro interno para teste

### Logs de Desenvolvimento

Em modo desenvolvimento, o sistema produz logs detalhados:

- Validações de entrada
- Operações de criptografia
- Tentativas de autenticação
- Queries do banco de dados
- Erros e exceções

### Ferramentas de Debug

- **Console logs** estruturados com prefixos identificadores
- **Stack traces** completos em desenvolvimento
- **Mensagens de erro** detalhadas para debugging
- **Validação de entrada** com logs de sanitização

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👥 Contribuição

Este projeto foi desenvolvido para fins acadêmicos. Contribuições são bem-vindas através de pull requests.

### Guidelines de Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📧 Contato

**Desenvolvedores**: Gabriel Coelho Soares e Mateus Araújo
**GitHub**: [@GabrielCoelho](https://github.com/GabrielCoelho)  & [@M-Araujo26](https://github.com/M-Araujo26)
**Projeto**: [ChemKey Repository](https://github.com/GabrielCoelho/ChemKey)

---

⚡ **ChemKey** - Mantendo suas chaves digitais seguras com precisão científica.
