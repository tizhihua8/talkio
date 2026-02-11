import structuredClone from "@ungap/structured-clone";
import { Buffer } from "buffer";
import * as ExpoCrypto from "expo-crypto";
import { Platform } from "react-native";

// Polyfill btoa and atob
if (typeof globalThis.btoa === "undefined") {
  globalThis.btoa = (str: string) => Buffer.from(str, "binary").toString("base64");
}
if (typeof globalThis.atob === "undefined") {
  globalThis.atob = (b64: string) => Buffer.from(b64, "base64").toString("binary");
}

// Polyfill crypto for AI SDK
if (!globalThis.crypto) {
  (globalThis as any).crypto = {
    getRandomValues: (array: Uint8Array) => {
      const bytes = ExpoCrypto.getRandomBytes(array.length);
      array.set(bytes);
      return array;
    },
    randomUUID: () => ExpoCrypto.randomUUID(),
    subtle: {
      digest: async (algorithm: string | { name: string }, data: BufferSource) => {
        const algoName = typeof algorithm === "string" ? algorithm : algorithm.name;
        const algoMap: Record<string, ExpoCrypto.CryptoDigestAlgorithm> = {
          "SHA-1": ExpoCrypto.CryptoDigestAlgorithm.SHA1,
          "SHA-256": ExpoCrypto.CryptoDigestAlgorithm.SHA256,
          "SHA-384": ExpoCrypto.CryptoDigestAlgorithm.SHA384,
          "SHA-512": ExpoCrypto.CryptoDigestAlgorithm.SHA512,
        };
        const expoCryptoAlgo = algoMap[algoName];
        if (!expoCryptoAlgo) {
          throw new Error(`Unsupported digest algorithm: ${algoName}`);
        }
        const uint8Data = data instanceof Uint8Array ? data : new Uint8Array(data as ArrayBuffer);
        return await ExpoCrypto.digest(expoCryptoAlgo, uint8Data);
      },
    },
  };
}

// structuredClone polyfill
if (!("structuredClone" in globalThis)) {
  (globalThis as any).structuredClone = structuredClone;
}

// TextEncoderStream / TextDecoderStream polyfill (needed by AI SDK on native)
if (Platform.OS !== "web") {
  const setupStreamPolyfills = async () => {
    try {
      const { polyfillGlobal } = await import(
        "react-native/Libraries/Utilities/PolyfillFunctions"
      );
      const { TextEncoderStream, TextDecoderStream } = await import(
        "@stardazed/streams-text-encoding"
      );
      polyfillGlobal("TextEncoderStream", () => TextEncoderStream);
      polyfillGlobal("TextDecoderStream", () => TextDecoderStream);
    } catch {
      // polyfills not available
    }
  };
  setupStreamPolyfills();
}

export {};
