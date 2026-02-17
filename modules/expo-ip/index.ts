import { requireNativeModule } from "expo-modules-core";

const ExpoIpModule = requireNativeModule("ExpoIp");

export function getWifiIP(): string {
  return ExpoIpModule.getWifiIP();
}
