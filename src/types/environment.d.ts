declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DB_HOST: string;
      DB_USER: string;
      DB_PASS: string;
      DB_NAME: string;

      STARK_PROJECT_ID: string;
      STARK_PRIVATE_KEY: string;

      SLACK_WEBHOOK_URL: string;
    }
  }
}

// If this file has no import/export statements (i.e. is a script file),
// convert it into a module by adding an empty export statement.
export {};
