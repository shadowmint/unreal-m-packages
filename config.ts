export interface Config {
  /** The path to the game root folder, relative to this folder */
  root: Array<string>;
}

export const Config: Config = {
  root: ["..", "..", "Game"],
};
