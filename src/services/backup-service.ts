import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { db, expoDb } from "../../db";
import { conversations, messages, messageBlocks } from "../../db/schema";
import { getItem, setItem } from "../storage/mmkv";
import { STORAGE_KEYS } from "../constants";
import { logger } from "./logger";

const log = logger.withContext("BackupService");

export interface BackupData {
  version: number;
  createdAt: string;
  conversations: any[];
  messages: any[];
  messageBlocks?: any[];
  mmkv?: {
    providers?: any[];
    models?: any[];
    identities?: any[];
    mcpTools?: any[];
    mcpServers?: any[];
    settings?: any;
  };
}

export async function createBackup(): Promise<string> {
  log.info("Creating backup...");

  const allConversations = await db.select().from(conversations);
  const allMessages = await db.select().from(messages);
  const allBlocks = await db.select().from(messageBlocks);

  const backup: BackupData = {
    version: 2,
    createdAt: new Date().toISOString(),
    conversations: allConversations,
    messages: allMessages,
    messageBlocks: allBlocks,
    mmkv: {
      providers: getItem(STORAGE_KEYS.PROVIDERS) ?? [],
      models: getItem(STORAGE_KEYS.MODELS) ?? [],
      identities: getItem(STORAGE_KEYS.IDENTITIES) ?? [],
      mcpTools: getItem(STORAGE_KEYS.MCP_TOOLS) ?? [],
      mcpServers: getItem(STORAGE_KEYS.MCP_SERVERS) ?? [],
      settings: getItem(STORAGE_KEYS.SETTINGS) ?? {},
    },
  };

  const fileName = `talkio-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  const cacheDir = FileSystem.cacheDirectory;
  if (!cacheDir) throw new Error("Cache directory not available");
  const fileUri = `${cacheDir}${fileName}`;
  await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(backup, null, 2));

  log.info(`Backup created: ${fileName} (${allConversations.length} conversations, ${allMessages.length} messages, ${allBlocks.length} blocks)`);
  return fileUri;
}

export async function shareBackup(): Promise<void> {
  const uri = await createBackup();
  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) {
    await Sharing.shareAsync(uri, {
      mimeType: "application/json",
      dialogTitle: "Export Talkio Backup",
    });
  } else {
    throw new Error("Sharing is not available on this platform");
  }
}

export async function restoreBackup(jsonContent: string): Promise<{ conversations: number; messages: number }> {
  log.info("Restoring backup...");

  let backup: BackupData;
  try {
    backup = JSON.parse(jsonContent);
  } catch {
    throw new Error("Invalid backup file format");
  }

  if (!backup.version || !backup.conversations || !backup.messages) {
    throw new Error("Invalid backup structure");
  }

  // Wrap in transaction: if any insert fails, roll back to preserve original data
  try {
    expoDb.execSync("BEGIN TRANSACTION");

    expoDb.execSync("DELETE FROM message_blocks");
    expoDb.execSync("DELETE FROM messages");
    expoDb.execSync("DELETE FROM conversations");

    for (const conv of backup.conversations) {
      await db.insert(conversations).values(conv);
    }

    for (const msg of backup.messages) {
      await db.insert(messages).values(msg);
    }

    // Restore message_blocks (v2+)
    if (backup.messageBlocks) {
      for (const block of backup.messageBlocks) {
        await db.insert(messageBlocks).values(block);
      }
    }

    expoDb.execSync("COMMIT");
  } catch (err) {
    expoDb.execSync("ROLLBACK");
    log.error(`Backup restore failed, rolled back: ${err instanceof Error ? err.message : "Unknown"}`);
    throw new Error("Restore failed — original data has been preserved.");
  }

  // Restore MMKV data (v2+)
  if (backup.mmkv) {
    if (backup.mmkv.providers) setItem(STORAGE_KEYS.PROVIDERS, backup.mmkv.providers);
    if (backup.mmkv.models) setItem(STORAGE_KEYS.MODELS, backup.mmkv.models);
    if (backup.mmkv.identities) setItem(STORAGE_KEYS.IDENTITIES, backup.mmkv.identities);
    if (backup.mmkv.mcpTools) setItem(STORAGE_KEYS.MCP_TOOLS, backup.mmkv.mcpTools);
    if (backup.mmkv.mcpServers) setItem(STORAGE_KEYS.MCP_SERVERS, backup.mmkv.mcpServers);
    if (backup.mmkv.settings) setItem(STORAGE_KEYS.SETTINGS, backup.mmkv.settings);
    log.info("MMKV data restored from backup");
  }

  const blockCount = backup.messageBlocks?.length ?? 0;
  log.info(`Backup restored: ${backup.conversations.length} conversations, ${backup.messages.length} messages, ${blockCount} blocks`);

  return {
    conversations: backup.conversations.length,
    messages: backup.messages.length,
  };
}
