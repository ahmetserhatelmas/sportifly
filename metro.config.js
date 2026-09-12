// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// web/ klasörü ayrı bir Next.js projesi; Metro'nun oradaki node_modules ve
// .next çıktısını taramasını engelle (hız + çakışma önlemi).
const escaped = path.join(__dirname, 'web').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
config.resolver.blockList = [
  ...(Array.isArray(config.resolver.blockList)
    ? config.resolver.blockList
    : config.resolver.blockList
      ? [config.resolver.blockList]
      : []),
  new RegExp(`^${escaped}/.*`),
];

module.exports = config;
