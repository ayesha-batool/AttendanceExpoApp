module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Handle font loading issues
      ['@babel/plugin-transform-runtime', {
        helpers: true,
        regenerator: true,
      }],
      // 'react-native-reanimated/plugin', // This must be last
    ],
  };
};
