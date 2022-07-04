export enum UnrealToolsErrorCode {
  UnableToFindProjectFolder = "UnableToFindProjectFolder",
}

export class UnrealToolsError extends Error {
  errorCode: UnrealToolsErrorCode;
  detail: string;
  constructor(errorCode: UnrealToolsErrorCode, message: string) {
    super(message);
    this.errorCode = errorCode;
    this.detail = message;
    this.stack = (<any>new Error()).stack;
  }
}
