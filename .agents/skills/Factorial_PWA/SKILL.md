```markdown
# Factorial_PWA Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches the core development patterns and conventions used in the Factorial_PWA TypeScript codebase. You'll learn how to write code that matches the project's style, structure your files, manage imports/exports, and follow commit and testing conventions. This guide is ideal for onboarding new contributors or maintaining consistency across the project.

## Coding Conventions

### File Naming
- Use **snake_case** for all file names.
  - **Example:**  
    ```
    user_profile.ts
    factorial_utils.ts
    ```

### Import Style
- Use **relative imports** for referencing modules within the project.
  - **Example:**  
    ```typescript
    import { calculateFactorial } from './factorial_utils';
    ```

### Export Style
- Use **named exports** for all exported functions, types, or constants.
  - **Example:**  
    ```typescript
    // factorial_utils.ts
    export function calculateFactorial(n: number): number { ... }
    ```

### Commit Messages
- Follow **conventional commit** format.
- Use the `fix` prefix for bug fixes.
  - **Example:**  
    ```
    fix: correct factorial calculation for negative inputs
    ```
- Typical commit message length is around 100 characters.

## Workflows

### Code Contribution
**Trigger:** When adding or modifying code in the repository  
**Command:** `/contribute`

1. Create or update files using snake_case naming.
2. Use relative imports and named exports as shown above.
3. Write or update corresponding test files (see Testing Patterns).
4. Commit your changes using the conventional commit format (`fix: ...` for bug fixes).
5. Submit a pull request for review.

### Writing Tests
**Trigger:** When adding new features or fixing bugs  
**Command:** `/write-test`

1. Create a test file matching the pattern `*.test.*` (e.g., `factorial_utils.test.ts`).
2. Write tests for all new or modified functions.
3. Use the project's preferred (unknown) testing framework.
4. Run tests locally to ensure they pass.

## Testing Patterns

- Test files follow the `*.test.*` naming convention.
  - **Example:**  
    ```
    factorial_utils.test.ts
    ```
- The specific testing framework is not detected; follow existing test file patterns.
- Place tests alongside or near the code they test.

## Commands
| Command        | Purpose                                  |
|----------------|------------------------------------------|
| /contribute    | Steps for contributing code               |
| /write-test    | Steps for writing and running tests       |
```
