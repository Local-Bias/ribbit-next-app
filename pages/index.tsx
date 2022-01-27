import { FC } from "react";
import type { NextPage } from "next";
import Head from "next/head";

const Link: FC<{ href: string }> = ({ href, children }) => (
  <a target="_blank" rel="nofollow noopener noreferrer" href={href}>
    {children}
  </a>
);

const Home: NextPage = () => (
  <div>
    <Head>
      <title>Ribbit</title>
      <meta name="description" content="ribbit next app" />
    </Head>
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1vh",
        alignItems: "center",
      }}
    >
      <Link href="https://ribbit.work">homepage</Link>
      <Link href="https://twitter.com/LbRibbit">twitter</Link>
      <Link href="https://github.com/Local-Bias">github</Link>
      <Link href="https://qiita.com/Ribbit">qiita</Link>
      <Link href="https://zenn.dev/ribbit">zenn</Link>
    </div>
  </div>
);

export default Home;
