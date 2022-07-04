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

Install node deps:

    npm ci

## Tooling

Fetch local changes for all packages from the local game:

    npm run pull-local-changes