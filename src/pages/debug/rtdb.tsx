import React, { useState, VFC, VFCX } from 'react';
import styled from '@emotion/styled';
import { Button, TextField } from '@mui/material';
import {
  getAllData,
  importCSV,
  mergeDatabase,
  writeUserData,
} from '../../lib/debug/realtime-database';
import { DropZone } from '../../components/drop-zone';
import { useDropzone } from 'react-dropzone';
import { mergeCounter, removeLegacyUserData } from 'src/lib/debug/rtdb';

type ContainerProps = Readonly<{}>;
type Props = ContainerProps & Readonly<{}>;

const Component: VFCX<Props> = ({ className }) => {
  const [hostname, setHostname] = useState('0');
  const { acceptedFiles, getInputProps, getRootProps } = useDropzone();

  return (
    <div {...{ className }}>
      <TextField
        label='hostname'
        type='text'
        value={hostname}
        onChange={(e) => setHostname(e.target.value)}
      />
      <div className='buttons'>
        <Button
          variant='contained'
          color='primary'
          onClick={() => {
            writeUserData(hostname, { pluginNames: ['test', 'test2'] });
          }}
        >
          Realtime Databaseにテストデータを送信
        </Button>

        <Button
          variant='contained'
          color='primary'
          onClick={async () => {
            await getAllData();
          }}
        >
          現在のRealtime Databaseの情報を取得
        </Button>
        <Button
          variant='contained'
          color='primary'
          onClick={async () => {
            await mergeCounter();
          }}
        >
          kintone/users情報をkintone/counterにマージ
        </Button>
        <Button
          variant='contained'
          color='error'
          onClick={async () => await removeLegacyUserData()}
        >
          不要なユーザーデータを削除
        </Button>
      </div>
      <div>
        <DropZone {...{ acceptedFiles, getInputProps, getRootProps }} />
      </div>
      <div>
        <Button
          variant='contained'
          color='primary'
          onClick={async () => {
            await importCSV(acceptedFiles);
          }}
        >
          CSVファイル読み込み
        </Button>
        <Button
          variant='contained'
          color='error'
          onClick={async () => {
            await mergeDatabase(acceptedFiles);
          }}
        >
          CSVデータをデータベースにマージ
        </Button>
      </div>
    </div>
  );
};

const StyledComponent = styled(Component)`
  display: flex;
  flex-direction: column;
  gap: 16px;

  .buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
`;

const Container: VFC<ContainerProps> = (props) => {
  return <StyledComponent {...props} />;
};

export default Container;
