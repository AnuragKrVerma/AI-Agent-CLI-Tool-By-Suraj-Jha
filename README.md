# Scrappy AI Tool

A CLI-based AI agent tool with OAuth authentication and device flow support.

Following = https://www.youtube.com/watch?v=vr6BmGpZjRs

## 📦 Project Structure

```
AI Agent CLI Tool/
├── client/          # Next.js frontend application
└── server/          # Node.js backend and CLI tool
    ├── src/
    │   ├── index.ts           # Express server
    │   ├── cli/
    │   │   ├── main.ts        # CLI entry point
    │   │   └── commands/      # CLI commands
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
   Create a `.env` file in the `server` directory:

   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
   BETTER_AUTH_SECRET="your-secret-key"
   BETTER_AUTH_URL="http://localhost:3005"
   ```

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
```

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
```

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
