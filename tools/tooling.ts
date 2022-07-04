import { Config } from "../config";
import * as path from "path";
import * as fs from "fs";
import { UnrealToolsError, UnrealToolsErrorCode } from "./errors";
import { copyRecursive, directoryNameFrom } from "./utils";

export enum UnrealPluginActionType {
  Patch = "Patch",
  Skip = " Skip",
}

export interface UnrealPluginAction {
  action: UnrealPluginActionType;
  name: string;
  from?: string;
  to?: string;
}

export interface UnrealPluginFolder {
  pluginName: string;
  moduleName: string;
  localPath: string;
  installedPath?: string;
}

export interface UnrealPlugin {
  rootPath: string;
  sourceFolders: UnrealPluginFolder[];
  name: string;
}

export class UnrealProject {
  rootFolder: string;
  localFolder: string;
  gameFolder: string;

  constructor() {
    // Remember the expected path is:
    // /Game
    // /packages/local-package
    // /packages/unreal-m-packages/...
    this.rootFolder = path.resolve(path.join(__dirname, ".."));
    this.localFolder = path.resolve(path.join(__dirname, "..", ".."));
    this.gameFolder = path.resolve(this.rootFolder, ...Config.root);
  }

  requireProjectExists() {
    if (!fs.existsSync(this.gameFolder)) {
      throw new UnrealToolsError(UnrealToolsErrorCode.UnableToFindProjectFolder, this.gameFolder);
    }
  }

  async findLocalPackages(): Promise<Array<UnrealPlugin>> {
    const localPackageFolders = (await fs.promises.readdir(this.rootFolder)).map((i) => path.join(this.rootFolder, i));
    const localWipFolders = (await fs.promises.readdir(this.localFolder)).map((i) => path.join(this.localFolder, i));

    // All these folders should be packages that may or may not be installed as plugins.
    const localFolders = [...localPackageFolders, ...localWipFolders].filter((i) => {
      const key = directoryNameFrom(i);
      return key !== "unreal-m-packages" && key.match(/unreal-m-.*/);
    });

    const localPlugins: Array<UnrealPlugin> = [];
    for (let folder of localFolders) {
      const plugin = await this.loadPluginFromFolder(folder);
      await this.findInstalledPluginFor(plugin);
      localPlugins.push(plugin);
    }

    return localPlugins;
  }

  /** An installed plugin has the same *key* but is in the installed plugins folder */
  private async findInstalledPluginFor(plugin: UnrealPlugin) {
    plugin.sourceFolders = plugin.sourceFolders.map((sourceFolder) => {
      const expectedPath = path.join(
        this.gameFolder,
        "Plugins",
        sourceFolder.moduleName,
        "Source",
        sourceFolder.pluginName
      );
      const installedPath = fs.existsSync(expectedPath) ? expectedPath : undefined;
      return { ...sourceFolder, installedPath };
    });
  }

  private async loadPluginFromFolder(folder: string): Promise<UnrealPlugin> {
    const packageName = directoryNameFrom(folder);

    // A package consists of multiple plugins
    const pluginsPath = path.resolve(folder, "src");

    // A plugin consists of multiple modules
    const plugins = (await fs.promises.readdir(pluginsPath)).map((i) => path.join(pluginsPath, i));
    const sourceFolders = (
      await Promise.all(
        plugins.map(async (pluginPath) => {
          const pluginName = directoryNameFrom(pluginPath);
          const pluginSrc = path.join(pluginPath, "Source");
          return (await fs.promises.readdir(pluginSrc)).map((j) => ({
            pluginName: pluginName,
            pluginPath: pluginSrc,
            moduleName: j,
          }));
        })
      )
    ).flatMap((i) => i);

    // Every folder in the plugins directory is uniquely named after it's plugin module.
    const sourceFoldersObjects = sourceFolders.map((details) => {
      const obj: UnrealPluginFolder = {
        pluginName: details.pluginName,
        moduleName: details.moduleName,
        localPath: path.join(details.pluginPath, details.moduleName),
      };
      return obj;
    });

    return {
      name: packageName,
      rootPath: folder,
      sourceFolders: sourceFoldersObjects,
    };
  }

  determinePatchActions(packages: Array<UnrealPlugin>): UnrealPluginAction[] {
    const patch: UnrealPluginAction[] = [];
    const skip: UnrealPluginAction[] = [];
    for (let pack of packages) {
      for (let folder of pack.sourceFolders) {
        if (folder.installedPath) {
          patch.push({
            action: UnrealPluginActionType.Patch,
            name: `${folder.moduleName}.${folder.moduleName}`,
            from: folder.installedPath,
            to: folder.localPath,
          });
        } else {
          skip.push({
            action: UnrealPluginActionType.Skip,
            name: `${folder.moduleName}.${folder.moduleName}`,
          });
        }
      }
    }
    return [...patch, ...skip];
  }

  /** Copy all the files from the source to the destination to keep the WIP changes */
  async patchInstalledToLocal(action: UnrealPluginAction, apply: boolean) {
    if (action.action === UnrealPluginActionType.Patch) {
      console.log(`: ${action.action}: ${action.name} (${action.from} => ${action.to})`);
      if (apply && action.to && action.from) {
        // Rename the target to a backup just in case
        if (fs.existsSync(action.to)) {
          const timestamp = new Date().getTime();
          const backupFolder = `${action.to}.backup.${timestamp}`;
          await fs.promises.rename(action.to, backupFolder);
          console.log(`:: created backup: ${backupFolder}`);
        }

        // Copy new to old
        await copyRecursive(action.from, action.to);
        console.log(`:: cp -r ${action.from} ${action.to}`);
      }
    } else if (action.action === UnrealPluginActionType.Skip) {
      console.log(`: ${action.action}: ${action.name}`);
    } else {
      console.log(`: Unknown action: ${action.action}`);
    }
  }
}
