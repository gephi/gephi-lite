import globals from 'globals'
import eslintjs from "@eslint/js";
import prettier from "eslint-plugin-prettier/recommended";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslintjs.configs.recommended,
  tseslint.configs.recommended,
  prettier,
  {
    ignores: ["**/build/*", "**/dist/*", "**/lib/*"],
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "react": react,
      "react-hooks": reactHooks,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      'react/prop-types': 'off',
      "react/display-name": "off",
      "@typescript-eslint/no-unused-vars": ["warn", {
        "args": "all",
        "argsIgnorePattern": "^_",
        "caughtErrors": "all",
        "caughtErrorsIgnorePattern": "^_",
        "destructuredArrayIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "ignoreRestSiblings": true
      }],
      "no-extra-boolean-cast": "off",
    },
  },
);
