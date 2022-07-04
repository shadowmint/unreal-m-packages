# setup

Expected folder structure:

    project/
    project/packages/my-local-package
    project/packages/unreal-m-packages
    project/Game/
    project/Game/Plugins

Fetch all:

    git submodule update --init --recursive

Update all:

    git submodule foreach git checkout main
    git submodule foreach git pull

Undo changes:

    git submodule foreach git checkout .
    git submodule foreach git clean -fd

Install node deps:

    npm ci

## Tooling

Show detected packages:

    npm run info

List patch intentions:

    npm run list

Patch packages from the version in the game:

    npm run patch
