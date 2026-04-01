const { getDefaultConfig } = require('expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

module.exports = (async () => {
  const config = {
    ...defaultConfig,
    transformer: {
      ...defaultConfig.transformer,
      getTransformOptions: async () => ({
        transform: {
          experimentalImportSupport: false,
          inlineRequires: true,
        },
      }),
    },
    resolver: {
      ...defaultConfig.resolver,
      // Support for DeepAR local module and other native deps
      extraNodeModules: {
        'react-native': require.resolve('react-native'),
      },
    },
  };

  return config;
})();
