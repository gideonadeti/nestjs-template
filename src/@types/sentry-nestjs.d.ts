declare module '@sentry/nestjs' {
  export declare function getIsolationScope(): {
    setTag: (key: string, value: string) => void;
  };
}
