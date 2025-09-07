module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      // Handle font loading issues
      ['@babel/plugin-transform-runtime', {
        helpers: true,
        regenerator: true,
      }],
    ],
  };
};
