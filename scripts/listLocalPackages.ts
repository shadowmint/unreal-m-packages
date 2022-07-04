import { UnrealProject } from "../tools/tooling";

(async () => {
  const tooling = new UnrealProject();
  tooling.requireProjectExists();

  const localPackages = await tooling.findLocalPackages();
  console.log(JSON.stringify(localPackages, null, 2));
})();
