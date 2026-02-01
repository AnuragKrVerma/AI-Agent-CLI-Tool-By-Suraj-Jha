import { promises as fs } from "node:fs";
import path from "node:path";
import { generateObject } from "ai";
import type { LanguageModel } from "ai";
import chalk from "chalk";
import { z } from "zod";

const ApplicationSchema = z.object({
  folderName: z.string().describe("Kabab-Case folder name of the application"),
  description: z.string().describe("Brief description of what was created"),
  files: z.array(
    z
      .object({
        path: z.string().describe("Relative file path (e.g src/App.tsx)"),
        content: z.string().describe("Complete file content"),
      })
      .describe("All files needed for the application"),
  ),
  setupCommands: z.array(
    z
      .string()
      .describe("Bash commands to setup & run (e.g: npm install, npm run dev)"),
  ),
  dependencies: z
    .array(
      z.object({
        name: z.string().describe("Package name"),
        version: z.string().describe("Package version"),
      }),
    )
    .optional()
    .describe("NPM dependencies with versions"),
});

type ApplicationResult = z.infer<typeof ApplicationSchema>;
type GeneratedFile = ApplicationResult["files"][number];
type TreeNode = {
  _files?: string[];
  [key: string]: TreeNode | string[] | undefined;
};

function printSystem(message: string) {
  console.log(message);
}

export async function generateApplication(
  description: string,
  aiService: { model: LanguageModel },
  cwd = process.cwd(),
) {
  try {
    printSystem(chalk.blue("\n Agent Mode Generating application..."));
    printSystem(chalk.gray(` Description: ${description}\n`));

    printSystem(chalk.magenta(" Agent Response: \n"));
    const { object: result } = await generateObject({
      model: aiService.model,
      schema: ApplicationSchema,
      prompt: `You are an expert polyglot software engineer with deep expertise across all programming languages, frameworks, and paradigms. Generate a complete, production-ready application based on this description: "${description}"

═══════════════════════════════════════════════════════════════════════════════
UNIVERSAL CODE QUALITY STANDARDS (Apply to ALL Languages)
═══════════════════════════════════════════════════════════════════════════════

1. ARCHITECTURE & DESIGN PRINCIPLES:
   ✓ Match complexity to requirements - don't over-engineer simple apps
   ✓ For simple apps: Keep it straightforward, minimal dependencies
   ✓ For complex apps: Follow SOLID, DRY, KISS, YAGNI principles
   ✓ Use proper separation of concerns and modularity
   ✓ Implement clear interfaces/contracts between components
   ✓ Apply appropriate architectural patterns (MVC, MVVM, Clean Architecture, etc.)
   ✓ Use dependency injection where applicable
   ✓ Follow domain-driven design for complex business logic

2. CODE QUALITY & MAINTAINABILITY:
   ✓ Write clean, readable, self-documenting code
   ✓ Use meaningful names (variables, functions, classes, modules)
   ✓ Follow language-specific naming conventions strictly
   ✓ Add comprehensive comments for complex algorithms
   ✓ Include documentation comments (JSDoc, JavaDoc, XML docs, docstrings, etc.)
   ✓ Keep functions/methods focused and single-purpose
   ✓ Avoid code duplication - extract reusable components
   ✓ Use proper type systems (TypeScript, Java generics, C++ templates, Python type hints)

3. ERROR HANDLING & VALIDATION:
   ✓ Implement robust error handling (try-catch, Result types, error boundaries)
   ✓ Validate all inputs at boundaries
   ✓ Use language-specific error handling patterns
   ✓ Provide meaningful error messages
   ✓ Log errors appropriately with context
   ✓ Handle edge cases and boundary conditions

4. SECURITY (Critical for All Languages):
   ✓ Sanitize and validate ALL user inputs
   ✓ Use parameterized queries/prepared statements (prevent SQL injection)
   ✓ Implement authentication & authorization correctly
   ✓ Use environment variables for secrets/credentials
   ✓ Apply principle of least privilege
   ✓ Protect against common vulnerabilities (XSS, CSRF, injection attacks)
   ✓ Use secure communication (HTTPS, encrypted connections)
   ✓ Implement rate limiting for APIs
   ✓ Hash passwords with proper algorithms (bcrypt, Argon2)

5. PERFORMANCE & OPTIMIZATION:
   ✓ Use efficient algorithms and data structures
   ✓ Avoid premature optimization but design for scalability
   ✓ Implement caching strategies where appropriate
   ✓ Use connection pooling for databases
   ✓ Lazy load resources when beneficial
   ✓ Minimize memory allocations in performance-critical code
   ✓ Use async/await or promises for I/O operations
   ✓ Profile and optimize hot paths

6. PROJECT STRUCTURE & ORGANIZATION:
   ✓ Follow language/framework standard directory structures
   ✓ Separate source code, tests, configs, and resources
   ✓ Use clear folder hierarchies (src/, tests/, docs/, config/, etc.)
   ✓ Group related files by feature or layer
   ✓ Include proper build/compilation configurations
   ✓ Add .gitignore with language-specific exclusions
For simple apps: Prefer zero dependencies when possible
   ✓ Use official package managers (npm/yarn, pip, Maven/Gradle, NuGet, Cargo, etc.)
   ✓ Specify exact versions for reproducibility
   ✓ Minimize external dependencies - question each addition(npm/yarn, pip, Maven/Gradle, NuGet, Cargo, etc.)
   ✓ Specify exact versions for reproducibility
   ✓ Minimize external dependencies
   ✓ Use well-maintained, reputable libraries only
   ✓ Include lock files (package-lock.json, poetry.lock, Cargo.lock, etc.)
   ✓ Document why each dependency is needed

8. TESTING & QUALITY ASSURANCE:
   ✓ Include unit tests with proper test frameworks
   ✓ Write integration tests for critical flows
   ✓ Use appropriate assertion libraries
   ✓ Aim for meaningful test coverage
   ✓ Include test examples for main functionality
   ✓ Use mocking/stubbing appropriately

9. DOCUMENTATION & README:
   ✓ Comprehensive README.md with project overview
   ✓ Installation/setup instructions step-by-step
   ✓ Usage examples and API documentation
   ✓ Prerequisites and system requirements
   ✓ Development and production deployment guides
   ✓ Troubleshooting section
   ✓ License and contribution guidelines

═══════════════════════════════════════════════════════════════════════════════
LANGUAGE-SPECIFIC IMPLEMENTATION RULES
═══════════════════════════════════════════════════════════════════════════════

VANILLA WEB (HTML/CSS/JavaScript Only - No Build Tools):
  • Pure HTML5 with semantic tags (header, nav, main, section, article, footer)
  • Modern CSS3 with flexbox/grid for layouts
  • Vanilla JavaScript (ES6+): modules, async/await, fetch API
  • No frameworks or build tools unless specifically requested
  • Use CSS variables for theming
  • Responsive design with media queries
  • Accessibility: ARIA labels, semantic HTML, keyboard navigation
  • Local storage for data persistence
  • Single index.html or multi-page structure based on complexity
  • Organize: index.html, styles/main.css, scripts/app.js
  • Include comments explaining key functionality
  • No dependencies - just open index.html in browser to run

JAVASCRIPT/TYPESCRIPT/NODE.JS:
  • Use ES6+ modern syntax (arrow functions, destructuring, async/await)
  • TypeScript: Enable strict mode, no 'any' types, use interfaces/types
  • Node.js: Use async/await, implement middleware pattern, use express/fastify
  • React: Functional components with hooks, proper key props, memo optimization
  • Next.js: App router, server components, proper metadata, SEO optimization
  • Package manager: npm/yarn/pnpm with package.json and package-lock

PYTHON:
  • Follow PEP 8 style guide strictly
  • Use type hints (Python 3.10+ syntax)
  • Virtual environment setup (venv/poetry)
  • Use dataclasses or Pydantic for data models
  • Async with asyncio for concurrent operations
  • FastAPI/Flask for web, with proper routing and validation
  • Requirements.txt or pyproject.toml for dependencies
  • Use pytest for testing
  • ML/AI: Include model training scripts, data preprocessing, evaluation metrics

JAVA:
  • Follow Java naming conventions (PascalCase classes, camelCase methods)
  • Use Java 17+ features (records, sealed classes, pattern matching)
  • Spring Boot: Proper annotations (@Service, @Repository, @Controller)
  • Maven/Gradle for build management with pom.xml/build.gradle
  • Implement interfaces, use dependency injection
  • JUnit 5 for testing
  • Proper exception hierarchy
  • Use Optional for nullable values
  • Include application.properties/yml

C#:
  • Follow C# naming conventions (PascalCase for public members)
  • ASP.NET Core: Controllers, services, repositories pattern
  • Use async/await throughout
  • Entity Framework Core for data access
  • Dependency injection via built-in container
  • Use records for DTOs
  • NuGet packages in .csproj
  • xUnit/NUnit for testing
  • appsettings.json for configuration
  • Minimal APIs for microservices

C++:
  • Modern C++ (C++17/20/23)
  • RAII for resource management
  • Smart pointers (unique_ptr, shared_ptr)
  • CMake for build system
  • Proper header guards or #pragma once
  • Separate .h/.hpp and .cpp files
  • Use STL containers and algorithms
  • Const correctness
  • Move semantics where applicable
  • Google Test or Catch2 for testing

NEST.JS:
  • Modular architecture with @Module decorators
  • Dependency injection with providers
  • DTOs with class-validator
  • Proper middleware, guards, interceptors
  • TypeORM/Prisma for database
  • Swagger/OpenAPI documentation
  • Exception filters for error handling
  • Config module for environment variables

GO:
  • Follow Go conventions (gofmt, golint)
  • Use go.mod for dependency management
  • Proper error handling (return error)
  • Goroutines and channels for concurrency
  • Interfaces for abstraction
  • Table-driven tests
  • Use context for cancellation
  • Gin/Echo for web frameworks

RUST:
  • Cargo for package management
  • Proper ownership and borrowing
  • Use Result<T, E> for error handling
  • Implement traits appropriately
  • Use cargo clippy recommendations
  • Async with tokio/async-std
  • Proper error types with thiserror/anyhow

MACHINE LEARNING / DATA SCIENCE PROJECTS:
  • Clear separation: data ingestion, preprocessing, training, evaluation, inference
  • Use established frameworks (TensorFlow, PyTorch, scikit-learn, JAX)
  • Include data validation and versioning strategies
  • Jupyter notebooks for exploration (separate from production code)
  • Model serialization (pickle, ONNX, SavedModel)
  • Training scripts with hyperparameter configuration
  • Evaluation metrics and visualization
  • Data pipelines with proper transforms
  • Requirements: numpy, pandas, matplotlib/seaborn
  • Docker container for reproducible environments
  • Model versioning and experiment tracking (MLflow, W&B)

MOBILE (React Native, Flutter, Swift, Kotlin):
  • Platform-specific configurations
  • Responsive design for multiple screen sizes
  • State management (Redux, Provider, Bloc, Riverpod)
  • Native module integration when needed
  • Proper navigation structure (React Navigation, Navigator 2.0)
  • Platform-specific icons and assets
  • React Native: Expo or bare workflow, proper Android/iOS setup
  • Flutter: Material/Cupertino widgets, proper pubspec.yaml
  • Swift/iOS: SwiftUI or UIKit, CocoaPods/SPM for dependencies
  • Kotlin/Android: Jetpack Compose or XML layouts, Gradle setup
  • Include platform folders (android/, ios/) with configurations
  • Handle permissions properly (camera, location, storage)
  • Offline-first architecture with local database (SQLite, Realm)

DESKTOP APPLICATIONS:
  • Electron: Main/renderer process separation, IPC communication
  • Tauri: Rust backend with web frontend, smaller bundle size
  • .NET MAUI: Cross-platform C# with XAML
  • Qt/C++: Widget-based UI or QML for modern interfaces
  • Include platform-specific installers/build scripts

DATABASES:
  • Use ORMs with migrations (Prisma, TypeORM, SQLAlchemy, EF Core, Sequelize)
  • Include schema definitions
  • Proper indexing strategies
  • Connection pooling
  • Seed data scripts for development

═══════════════════════════════════════════════════════════════════════════════
FILE & CONFIGURATION REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

ALWAYS INCLUDE:
  ✓ README.md with complete setup instructions
  ✓ .gitignore (language/framework-specific)
  ✓ .env.example with required environment variables
  ✓ Build configuration (package.json, Cargo.toml, pom.xml, CMakeLists.txt, etc.)
  ✓ Linting/formatting configs (eslintrc, prettier, pylint, rustfmt.toml, etc.)
  ✓ Testing configuration
  ✓ CI/CD pipeline example (GitHub Actions, GitLab CI)
  ✓ Docker files for containerization (if applicable)
  ✓ License file (MIT recommended)

CODE COMPLETENESS:
  ✓ Every file must be 100% complete and functional
  ✓ No placeholders, TODOs, or "implement this later" comments
  ✓ All imports/includes present
  ✓ All functions/methods fully implemented
  ✓ Ready to compile/run immediately after setup

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

folderName: kebab-case, descriptive project name matching tech stack
description: Clear 2-3 sentence summary of what was built and tech used
files: Array of {path, content} - all necessary files with complete code
setupCommands: Ordered array of shell commands to setup and run
dependencies: Array of {name, version} - all packages needed

═══════════════════════════════════════════════════════════════════════════════
FINAL DELIVERABLES
═══════════════════════════════════════════════════════════════════════════════

✓ Production-ready, enterprise-quality code
✓ Follows all language-specific best practices
✓ Secure, performant, and maintainable
✓ Complete documentation and setup instructions
✓ Ready to compile/run without any modifications
✓ Scalable architecture that can grow with requirements

Generate the output as a valid JSON object matching the exact schema.`,
    });

    printSystem(chalk.gray("\n Application Generated Successfully!\n"));
    printSystem(
      chalk.blue(
        ` Folder Name: ${result.folderName}\n Description: ${result.description}\n`,
      ),
    );
    if (result.files?.length === 0) {
      throw new Error("No files were generated for the application.");
    }

    displayFileTree(result.files, result.folderName);

    printSystem(chalk.cyan("\n Creating application files...\n"));
    const appDir = await createApplicationFiles(
      cwd,
      result.folderName,
      result.files,
    );

    printSystem(
      chalk.green(
        ` Application files created successfully in folder: ${appDir} \n`,
      ),
    );
    printSystem(chalk.cyan(`Location: ${chalk.bold(appDir)} \n`));

    if (result.setupCommands && result.setupCommands.length > 0) {
      printSystem(
        chalk.yellow(
          " Setup & Run Commands:\n" +
            result.setupCommands
              .map((cmd, idx) => `  ${idx + 1}. ${cmd}`)
              .join("\n") +
            "\n",
        ),
      );
    }
    return {
      folderName: result.folderName,
      appDir,
      files: result.files.map((f) => f.path),
      commands: result.setupCommands,
      success: true,
    };
  } catch (error) {
    printSystem(
      chalk.red(
        "\n Error generating application: " +
          (error instanceof Error ? error.message : String(error)),
      ),
    );
    if (error instanceof Error && error.stack) {
      printSystem(chalk.red(`${error.stack}\n`));
    }
    throw error;
  }
}

async function createApplicationFiles(
  baseDir: string,
  folderName: string,
  files: GeneratedFile[],
) {
  const appDir = path.join(baseDir, folderName);
  await fs.mkdir(appDir, { recursive: true });

  printSystem(chalk.gray(` Creating application directory at: ${appDir}`));

  for (const file of files) {
    const filePath = path.join(appDir, file.path);
    const dirPath = path.dirname(filePath);
    await fs.mkdir(dirPath, { recursive: true });
    await fs.writeFile(filePath, file.content, "utf8");
    printSystem(chalk.gray(`  Created file: ${file.path}`));
  }

  return appDir;
}

function displayFileTree(files: GeneratedFile[], folderName: string) {
  printSystem(chalk.green("\nGenerated Application File Structure:\n"));
  printSystem(chalk.white(`${folderName}/`));

  // Build tree structure
  const tree: TreeNode = {};
  files.forEach((file: GeneratedFile) => {
    const parts = file.path.split("/");
    let current: TreeNode = tree;
    parts.forEach((part: string, index: number) => {
      if (index === parts.length - 1) {
        // It's a file
        if (!current._files) current._files = [];
        current._files.push(part);
      } else {
        // It's a directory
        if (!current[part]) current[part] = {};
        current = current[part] as TreeNode;
      }
    });
  });

  // Render tree recursively
  function renderTree(node: TreeNode, prefix = "") {
    const dirs = Object.keys(node).filter((key) => key !== "_files");
    const fileList = node._files || [];

    // Render directories first
    dirs.forEach((dir, index) => {
      const isLastDir = index === dirs.length - 1 && fileList.length === 0;
      const connector = isLastDir ? "└── " : "├── ";
      const extension = isLastDir ? "    " : "│   ";

      printSystem(chalk.cyan(`${prefix}${connector}${dir}/`));
      renderTree(node[dir] as TreeNode, prefix + extension);
    });

    // Render files
    fileList.forEach((file, index) => {
      const isLastFile = index === fileList.length - 1;
      const connector = isLastFile ? "└── " : "├── ";
      printSystem(chalk.gray(`${prefix}${connector}${file}`));
    });
  }

  renderTree(tree);
  printSystem("");
}
