module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      [
        'module-resolver',
        {
          root: ['./src'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@screens': './src/screens',
            '@services': './src/services',
            '@navigation': './src/navigation',
            '@theme': './src/theme',
            '@assets': './src/assets',
            '@hooks': './src/hooks',
            '@utils': './src/utils',
            '@store': './src/store',
            '@types': './src/types',
          },
        },
      ],
      '@babel/plugin-transform-export-namespace-from',
    ],
  };
};
