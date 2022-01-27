import React from 'react';

declare module 'react' {
  type FCX<P = Record<string, unknown>> = React.FunctionComponent<P & { className?: string }>;
  type VFCX<P = Record<string, unknown>> = React.VoidFunctionComponent<P & { className?: string }>;
}
