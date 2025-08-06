# Husky Setup Instructions

Since this project is not yet a git repository, Husky cannot be automatically initialized. 
Follow these steps when you're ready to set up git hooks:

## 1. Initialize Git Repository
```bash
git init
```

## 2. Initialize Husky
```bash
npx husky init
```

## 3. Add Pre-commit Hook
```bash
echo "npx lint-staged" > .husky/pre-commit
```

## 4. Add Pre-push Hook
```bash
echo "npm test" > .husky/pre-push
```

## 5. Add Commit Message Linting (Optional)
```bash
npm install --save-dev @commitlint/cli @commitlint/config-conventional
echo "module.exports = {extends: ['@commitlint/config-conventional']}" > commitlint.config.js
echo "npx --no-install commitlint --edit \$1" > .husky/commit-msg
```

## Current Configuration

### Lint-staged Configuration (.lintstagedrc.json)
- Runs ESLint with --fix on all JS/TS files
- Runs Prettier on all files
- Automatically fixes issues before commit

### Recommended Git Hooks
1. **pre-commit**: Run lint-staged (linting + formatting)
2. **pre-push**: Run tests
3. **commit-msg**: Validate commit message format

## Benefits
- Prevents committing code with linting errors
- Ensures consistent code formatting
- Prevents pushing broken tests
- Enforces commit message standards