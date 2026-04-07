# Factorial PWA - Project Initialization

## Project Description
Factorial PWA is a Progressive Web Application built with TypeScript.

## Tech Stack
- **Language:** TypeScript
- **Type:** Progressive Web App (PWA)

## Project Structure
```
/
├── .claude/
│   ├── rules/typescript/   # TypeScript coding rules & conventions
│   ├── commands/           # Custom commands
│   ├── settings.local.json
│   └── .mcp.json
├── CLAUDE.md               # Claude Code project instructions
└── gemini.md               # This file
```

## Coding Conventions
- Follow TypeScript best practices defined in `.claude/rules/typescript/`
- Use explicit types for public APIs, shared models, and component props
- Let TypeScript infer obvious local variable types
- Prefer `interface` for object shapes that may be extended
- Use `type` for unions, intersections, and mapped types

## Security
- Validate all user inputs
- Sanitize data before rendering
- Use environment variables for secrets
- Follow OWASP guidelines

## Testing
- Write unit tests for business logic
- Write integration tests for API endpoints
- Maintain adequate test coverage
