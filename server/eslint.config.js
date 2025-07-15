// eslint.config.js
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    // Apply type-aware linting to TypeScript files in src
    files: ['src/**/*.ts'], // Only target .ts files in src for type-aware linting
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json', // This requires the files to be in the TS project
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2020,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    // Apply basic linting (non-type-aware) to JavaScript config files in the root
    files: ['*.js'], // Target JavaScript files directly in the root (like config files)
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      // No 'parserOptions.project' here, as these files are not part of the TypeScript project
      // And we use the default parser for JavaScript
      globals: {
        ...globals.node, // These are Node.js config files
      },
    },
    rules: {
      // You can add specific rules for JS config files if needed
      // For example, if you want to allow console.log in config files
      // 'no-console': 'off',
    },
  }
);
