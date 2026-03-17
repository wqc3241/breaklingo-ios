const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    // Block expo-file-system and expo-modules-core native shims from being bundled.
    // We use native AudioPlayerModule/AudioRecorderModule instead of expo-av.
    blockList: [
      /node_modules\/expo-file-system\//,
      /node_modules\/expo\/node_modules\/expo-file-system\//,
    ],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
