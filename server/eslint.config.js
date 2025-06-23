import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    files: ['src/**/*.ts', '*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2020,
      },
    },
    rules: {
      // FIX: Tell @typescript-eslint/no-unused-vars to ignore variables starting with an underscore
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_', // Ignore arguments that start with an underscore
        varsIgnorePattern: '^_', // Ignore variables that start with an underscore
        caughtErrorsIgnorePattern: '^_', // Ignore caught errors that start with an underscore
      }],
      // If you're getting `no-unused-vars` from ESLint itself (not TS ESLint),
      // you might also need to disable it as it conflicts with the TS version:
      // 'no-unused-vars': 'off',
    },
  }
);
