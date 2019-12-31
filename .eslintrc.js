module.exports = {
  parser: '@typescript-eslint/parser',
  env: {
    jest: true,
  },
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
    ecmaFeatures: {
      modules: true
    },
  },
  plugins: ['@typescript-eslint',"prettier"],
  extends: [
    'prettier',
    'plugin:import/typescript',
  ],
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      rules: {
        '@typescript-eslint/no-unused-vars': [2, { args: 'none' }]
      }
    }
  ],
  rules: {
    'react/prop-types': 0,
    'react/jsx-filename-extension': 0,
    "no-param-reassign":0,
    'no-void':0,
    "no-nested-ternary":0,
    'react/jsx-props-no-spreading': 0,
    'no-multi-assign':0,
    'import/no-extraneous-dependencies':0,
    'no-plusplus':0,
    "prettier/prettier":"error"
  }
};
