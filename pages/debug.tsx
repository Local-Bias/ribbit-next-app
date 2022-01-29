import React, { useState, VFC, VFCX } from "react";
import styled from "@emotion/styled";
import Link from "next/link";
import { Button } from "../components/button";
import { TextField } from "@mui/material";
import useSWR from "swr";

type ContainerProps = Readonly<{}>;
type Props = ContainerProps & Readonly<{}>;

const fetcher = async (url: string) => {
  const response = await fetch(url);
  return response.json();
};

const KintoneStatus: VFC = () => {
  const { data, error } = useSWR("/api/kintone/summary", fetcher);

  if (error) {
    return <div>データが取得できませんでした</div>;
  }
  if (!data) {
    return <div>Loading</div>;
  }
  return (
    <div>
      <div>利用法人数:{data?.numUsers}</div>
      <div>プラグインが呼び出された回数:{data?.counter}</div>
    </div>
  );
};

const Component: VFCX<Props> = ({ className }) => {
  const [hostname, setDomain] = useState("my domain");
  const [res, setRes] = useState("");
  const [log, setLog] = useState("");

  const onFetchButtonClick = async () => {
    const response = await fetch("/api/kintone/user", {
      method: "POST",
      body: JSON.stringify({ hostname, pluginNames: [String(Math.random())] }),
    });

    setRes(JSON.stringify(response));
  };

  return (
    <div {...{ className }}>
      <div>
        <KintoneStatus />
        <div>res:{res}</div>
        <div>
          <textarea value={log} onChange={(e) => setLog(e.target.value)} />
        </div>
      </div>
      <div>
        <TextField
          label="domain"
          type="text"
          value={hostname}
          onChange={(e) => setDomain(e.target.value)}
        />
        <Button onClick={() => onFetchButtonClick()}>POST /api/kintone</Button>
        <Link href="/">
          <Button>home</Button>
        </Link>
      </div>
    </div>
  );
};

const StyledComponent = styled(Component)`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  min-height: 100vh;

  textarea {
    border: 0;
    box-shadow: inset 0 1px 3px 0 #0003;
    padding: 0.7em;
  }

  > div {
    width: 100%;
    display: flex;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 2vmin;
    padding: 10vmin;
    background-color: #fffa;
    box-shadow: 0 1px 3px -1px #0003;
  }
`;

const Container: VFC<ContainerProps> = () => {
  return <StyledComponent />;
};

export default Container;
