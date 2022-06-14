import type { AppProps } from 'next/app';
import 'sanitize.css';
import 'src/styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default MyApp;
