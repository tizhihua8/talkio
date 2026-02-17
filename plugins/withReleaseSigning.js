const { withAppBuildGradle } = require("@expo/config-plugins");

function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    let gradle = cfg.modResults.contents;

    // Add release signing config alongside existing debug config
    if (!gradle.includes("signingConfigs.release")) {
      // Add release entry inside signingConfigs block
      gradle = gradle.replace(
        /signingConfigs\s*\{([\s\S]*?)(    \})\n    buildTypes/,
        (match, inner, closing) =>
          `signingConfigs {${inner}        release {\n            storeFile file("../../release-key.jks")\n            storePassword "avatar2025"\n            keyAlias "release-key"\n            keyPassword "avatar2025"\n        }\n    }\n    buildTypes`
      );

      // Replace signingConfig in release buildType
      gradle = gradle.replace(
        /(release\s*\{[^}]*?)signingConfig signingConfigs\.debug/,
        "$1signingConfig signingConfigs.release"
      );
    }

    cfg.modResults.contents = gradle;
    return cfg;
  });
}

module.exports = withReleaseSigning;
