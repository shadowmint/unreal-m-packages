import { UnrealProject } from "../tools/tooling";

(async () => {
  const tooling = new UnrealProject();
  tooling.requireProjectExists();
  const packages = await tooling.findLocalPackages();
  const actions = tooling.determinePatchActions(packages);
  for (const action of actions) {
    await tooling.patchInstalledToLocal(action, false);
  }
})();
