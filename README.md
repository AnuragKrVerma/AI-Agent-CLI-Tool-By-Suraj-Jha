# Scrappy AI Tool

A powerful CLI-based AI agent tool with OAuth authentication, multiple interaction modes, and autonomous application generation capabilities.

## ✨ Features

- 🤖 **Three AI Interaction Modes:**
  - **Chat Mode**: Simple conversation with AI
  - **Tools Mode**: Enhanced chat with Google Search & Code Execution
  - **Agent Mode**: Autonomous application generator for any tech stack
- 🔐 **Secure OAuth Authentication** with device flow
- 🎯 **Multi-language Support**: Generate apps in JavaScript, TypeScript, Python, Java, C#, C++, Go, Rust, and more
- 📱 **Cross-platform**: Web, mobile, desktop, ML/AI applications
- 🛠️ **Production-ready Code**: Complete, functional applications with proper architecture

## 📦 Project Structure

```
AI Agent CLI Tool/
├── client/          # Next.js frontend (OAuth web interface)
│   ├── src/
│   │   ├── app/            # Next.js 16 App Router
│   │   ├── components/     # Reusable UI components
│   │   └── lib/            # Client utilities
│   └── package.json
└── server/          # Node.js backend and CLI tool
    ├── src/
    │   ├── index.ts           # Express server
    │   ├── cli/
    │   │   ├── main.ts        # CLI entry point
    │   │   ├── commands/      # CLI commands (login, logout, wakeup)
    │   │   ├── chat/          # Chat implementations
    │   │   └── ai/            # AI service integrations
    │   ├── config/
    │   │   └── agent.config.ts  # Agent prompt & app generation
    │   ├── service/           # Business logic
    │   └── lib/               # Shared libraries
    ├── bin/
    │   └── scrappy.js         # CLI wrapper script
    ├── prisma/
    │   └── schema.prisma      # Database schema
    └── package.json           # Server dependencies and CLI config
```

## 🚀 Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- Git Bash (for Windows users)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd "AI Agent CLI Tool"
   ```

2. **Install server dependencies**

   ```bash
   cd server
   npm install
   ```

3. **Setup environment variables**

   Create a `.env` file in the `server` directory with the following variables:

   ```env
   # Server Configuration
   PORT=3005

   # Database Configuration (PostgreSQL/Neon)
   DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"

   # Better Auth Configuration
   BETTER_AUTH_SECRET="your-secret-key-min-32-characters"
   BETTER_AUTH_URL="http://localhost:3005"

   # OAuth Providers (GitHub)
   GITHUB_CLIENT_ID="your-github-client-id"
   GITHUB_CLIENT_SECRET="your-github-client-secret"

   # Frontend/Backend URLs
   FRONTEND_URL="http://localhost:3000"
   BACKEND_URL="http://localhost:3005"

   # Google Generative AI Configuration
   GOOGLE_GENERATIVE_AI_API_KEY="your-google-ai-api-key"
   SCRAPPY_MODEL="gemini-2.5-flash"
   ```

   **How to get the required credentials:**
   - **DATABASE_URL**:
     - Use [Neon](https://neon.tech) for free PostgreSQL hosting
     - Or use local PostgreSQL: `postgresql://postgres:password@localhost:5432/scrappy_db`
   - **BETTER_AUTH_SECRET**:
     - Generate a secure random string (min 32 characters)
     - Example: `openssl rand -base64 32`
   - **GITHUB_CLIENT_ID & GITHUB_CLIENT_SECRET**:
     1. Go to GitHub → Settings → Developer settings → OAuth Apps
     2. Create a new OAuth App
     3. Set Authorization callback URL: `http://localhost:3005/api/auth/callback/github`
     4. Copy Client ID and generate a new Client Secret
   - **GOOGLE_GENERATIVE_AI_API_KEY**:
     1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
     2. Create or select a project
     3. Generate an API key
     4. Copy the API key
   - **SCRAPPY_MODEL**:
     - Options: `gemini-2.5-flash`, `gemini-2.0-pro`, `gemini-1.5-pro`
     - `gemini-2.5-flash` is recommended for speed and cost-effectiveness

4. **Run database migrations**

   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Install CLI globally**

   ```bash
   npm link
   ```

   This creates a global `Scrappy` command that can be used anywhere.

6. **Start the server**
   ```bash
   npm run dev
   ```

### Client Setup

1. **Navigate to client directory**

   ```bash
   cd ../client
   npm install
   ```

2. **Start the development server**
   ```bash
   npm run dev
   ```

## 🔧 CLI Configuration

### package.json Configuration

The CLI tool is configured in `server/package.json`:

```json
{
  "name": "server",
  "type": "module",
  "bin": {
    "Scrappy": "./bin/scrappy.js"
  },
  "scripts": {
    "dev": "nodemon src/index.ts",
    "start": "node src/index.ts",
    "build": "tsc",
    "cli": "node --loader ts-node/esm src/cli/main.ts"
  }
}
```

**Key Configuration Details:**

- **`type: "module"`** - Enables ES Module support
- **`bin.Scrappy`** - Defines the global command name and entry point
- **Entry point:** `./bin/scrappy.js` - Wrapper script that uses `tsx` to run TypeScript files

### CLI Wrapper Script

The `bin/scrappy.js` file is a wrapper that:

1. Uses `tsx` (TypeScript Execute) to run `.ts` files directly
2. Handles ESM module resolution issues on Windows
3. Spawns a child process with proper TypeScript support
4. Passes all command-line arguments to the main CLI script

```javascript
#!/usr/bin/env node
// Wrapper script that executes src/cli/main.ts using tsx
```

### Making the CLI Executable

On Unix-based systems (Linux/Mac) and Git Bash on Windows:

```bash
chmod +x bin/scrappy.js
```

This makes the script executable without needing to prefix it with `node`.

## 📝 CLI Commands

### Available Commands

```bash
# Display help
Scrappy --help

# Show version
Scrappy --version

# Login to the AI Agent CLI
Scrappy login

# Login with custom server URL and client ID
Scrappy login --serverUrl http://localhost:3005 --clientId YOUR_CLIENT_ID

# Logout from the AI Agent CLI
Scrappy logout

# Display currently logged in user
Scrappy whoami

# Wake up the AI service (main command)
Scrappy wakeup
```

### 🚀 Scrappy Wakeup - AI Interaction Modes

After running `Scrappy wakeup`, you'll be presented with three interaction modes:

#### 1. **Chat Mode** 💬

Simple conversational AI interaction.

- Direct chat with Google's Gemini AI
- Natural language conversations
- Quick Q&A and assistance
- No tools or autonomous actions

```bash
Scrappy wakeup → Select "Chat"
```

#### 2. **Tools Mode** 🛠️

Enhanced chat with powerful tools integration.

- **Google Search**: Real-time web search for current information
- **Code Execution**: Execute JavaScript/Python code snippets
- **URL Context**: Fetch and summarize web page content
- Combines AI reasoning with live data

```bash
Scrappy wakeup → Select "Tools"
```

**Available Tools:**

- `google_search` - Search the web for current events and information
- `code_execution` - Execute code for calculations and data processing
- `url_context` - Fetch and analyze content from URLs

#### 3. **Agent Mode** 🤖 (Autonomous Application Generator)

The most powerful mode - generates complete, production-ready applications.

```bash
Scrappy wakeup → Select "Agentic Mode"
```

**What Agent Mode Can Build:**

| Application Type   | Examples                                                           |
| ------------------ | ------------------------------------------------------------------ |
| **Web Apps**       | React, Next.js, Vue, Angular, vanilla HTML/CSS/JS                  |
| **Backend APIs**   | Node.js/Express, Python/FastAPI, Java/Spring Boot, C#/ASP.NET Core |
| **Mobile Apps**    | React Native, Flutter, Swift, Kotlin                               |
| **Desktop Apps**   | Electron, Tauri, .NET MAUI, Qt                                     |
| **ML/AI Projects** | TensorFlow, PyTorch, scikit-learn with data pipelines              |
| **CLI Tools**      | Node.js, Python, Go, Rust command-line tools                       |
| **Databases**      | Full-stack apps with PostgreSQL, MongoDB, MySQL                    |

**Example Prompts for Agent Mode:**

````bash
# Simple vanilla web app
"Create a todo app using HTML, CSS, and JavaScript only"
Server Dependencies

**AI & Tools:**
- `@ai-sdk/google` ^3.0.18 - Google Generative AI SDK
- `ai` ^6.0.64 - Vercel AI SDK for streaming and tool calling

**CLI Framework:**
- `commander` ^14.0.2 - CLI framework for building command-line tools
- `@clack/prompts` ^1.0.0 - Beautiful interactive prompts
- `chalk` ^5.6.2 - Terminal string styling
- `figlet` ^1.10.0 - ASCII art generator for CLI banner
- `boxen` ^8.0.1 - Create boxes in terminal
- `yocto-spinner` ^1.0.0 - Terminal spinner
- `marked` ^15.0.12 - Markdown parser
- `marked-terminal` ^7.3.0 - Render markdown in terminal

**Backend & Auth:**
- `express` ^5.2.1 - Web server framework
- `better-auth` ^1.4.18 - Authentication library with OAuth support
- `cors` ^2.8.6 - CORS middleware
- `open` ^11.0.0 - Open URLs in browser

**Database:**
- `@prisma/client` ^7.3.0 - Prisma ORM client
- `@prisma/adapter-pg` ^7.3.0 - PostgreSQL adapter for Prisma
- `pg` ^8.17.2 - PostgreSQL client

**Utilities:**
- `dotenv` ^17.2.3 - Environment variable management
- `zod` ^4.3.6 - Schema validation

### Server Dev Dependencies

- `typescript` ^5.9.3 - TypeScript compiler
- `tsx` ^4.21.0 - TypeScript execute - runs .ts files directly
- `ts-node` ^10.9.2 - TypeScript execution engine
- `nodemon` ^3.1.11 - Auto-restart server on file changes
- `prisma` ^7.3.0 - Prisma CLI for migrations

### Client Dependencies

**Framework:**
- `next` 16.1.6 - Next.js React framework
- `react` 19.2.3 - React library
- `react-dom` 19.2.3 - React DOM renderer

**UI Components (Radix UI):**
- Complete set of accessible, unstyled React components
- Includes: accordion, alert-dialog, avatar, checkbox, dialog, dropdown-menu, select, tabs, tooltip, and more

**Form & Validation:**
- `react-hook-form` ^7.71.1 - Form state management
- `@hookform/resolvers` ^5.2.2 - Validation resolvers
- `zod` ^4.3.6 - Schema validation

**Styling:**
- `tailwindcss` ^4 - Utility-first CSS framework
- `class-variance-authority` ^0.7.1 - Component variant styling
- `clsx` ^2.1.1 - Conditional class names
- `tailwind-merge` ^3.4.0 - Merge Tailwind classes

**Additional Features:**
- `better-auth` ^1.4.18 - Authentication client
- `next-themes` ^0.4.6 - Theme management
- `lucide-react` ^0.563.0 - Icon library
- `recharts` ^2.15.4 - Chart library
- `sonner` ^2.0.7 - Toast notifications
**Agent Mode Features:**
- ✅ Generates complete file structure
- ✅ Production-ready, fully functional code
- ✅ All dependencies with exact versions
- ✅ Setup and run commands
- ✅ Configuration files (tsconfig, .env.example, etc.)
- ✅ README with documentation
- ✅ Follows best practices for chosen language/framework
- ✅ Security, testing, and error handling included

## 🔐 Authentication Flow

The CLI uses OAuth Device Flow for authentication:

1. User runs `Scrappy login`
2. CLI generates a device code and displays a verification URL
3. User visits the URL in their browser and enters the code
4. CLI polls the server until authentication is complete
5. Access token is stored locally for subsequent requests

## 🛠️ Development Workflow

### Running the CLI in Development

Without global installation:

```bash
cd server
npm run cli -- login
````

With global installation:

```bash
Scrappy login
```

### Building the Project

```bash
cd server
npm run build
```

This compiles TypeScript files to JavaScript in the `dist/` directory.

### Database Migrations

Create a new migration:

```bash
npx prisma migrate dev --name description_of_changes
```

Apply migrations:

```bash
npx prisma migrate deploy
```

Reset database (⚠️ Development only):

```bash
npx prisma migrate reset
```

## 📚 Dependencies

### Runtime Dependencies

- **commander** - CLI framework for building command-line tools
- **chalk** - Terminal string styling
- **figlet** - ASCII art generator for CLI banner
- **@clack/prompts** - Beautiful prompts for CLI
- **dotenv** - Environment variable management
- **express** - Web server framework
- **better-auth** - Authentication library
- **prisma** - Database ORM

### Development Dependencies

- **tsx** - TypeScript execute - runs .ts files directly
- **typescript** - TypeScript compiler
- **nodemon** - Auto-restart server on file changes
- **ts-node** - TypeScript execution engine

## 🔄 Updating the CLI Command Name

If you want to rename the CLI command:

1. Update `bin` field in `server/package.json`:

   ```json
   "bin": {
     "your-new-name": "./bin/scrappy.js"
   }
   ```

2. Update the Command name in `src/cli/main.ts`:

   ```typescript
   const program = new Command("your-new-name");
   ```

3. Rebuild and relink:
   ```bash
   npm run build
   npm link
   ```

## 🐛 Troubleshooting

### Command not found after npm link

1. Ensure npm global bin is in your PATH:

   ```bash
   npm config get prefix
   ```

2. Add the npm bin directory to your PATH (usually `~/.npm-global/bin` or `%APPDATA%/npm`)

3. Relink the package:
   ```bash
   cd server
   npm unlink -g
   npm link
   ```

### Module resolution errors

If you see ESM import errors:

1. Ensure `package.json` has `"type": "module"`
2. Regenerate Prisma client:
   ```bash
   npx prisma generate
   ```

### Windows-specific issues

- Use Git Bash or WSL for running Unix commands like `chmod`
- Ensure paths use forward slashes in the code
- File URLs must use proper `file://` protocol for ESM imports

## 📄 License

ISC

## 👥 Author

Created as part of the AI Agent CLI Tool project.
