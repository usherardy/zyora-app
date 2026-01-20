const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');
 
const config = getDefaultConfig(__dirname)

// Add middleware to apply COOP headers for OAuth support
config.server = {
  ...config.server,
  middleware: [
    (req, res, next) => {
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
      res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
      next();
    },
    ...(config.server?.middleware || []),
  ],
};

module.exports = withNativeWind(config, { input: './global.css' })