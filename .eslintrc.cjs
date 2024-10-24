module.exports = {
  extends: ['next/core-web-vitals', 'eslint:recommended', 'plugin:react/recommended'],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react/jsx-key': 'error',
    'react/no-unescaped-entities': 'error',
    'no-unused-vars': 'warn',
    '@next/next/no-img-element': 'warn',
    'react-hooks/exhaustive-deps': 'warn',
  },
};