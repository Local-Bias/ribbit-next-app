import React, { VFCX } from "react";
import styled from "@emotion/styled";
import { DropzoneState } from "react-dropzone";

type Props = Pick<
  DropzoneState,
  "getRootProps" | "acceptedFiles" | "getInputProps"
>;

const Component: VFCX<Props> = ({
  getRootProps,
  acceptedFiles,
  getInputProps,
  className,
}) => (
  <div className={className}>
    <ul>
      {acceptedFiles.map(
        (file: any, index) => index < 5 && <li key={file.path}>{file.path}</li>
      )}
      {acceptedFiles.length > 5 && (
        <li>...and {acceptedFiles.length - 5} files</li>
      )}
    </ul>
    <div {...getRootProps()}>
      <input {...getInputProps()} />
      <p>ここにドロップするか、クリックして選択してください</p>
    </div>
  </div>
);

const StyledComponent = styled(Component)`
  & > ul {
    font-size: 95%;
    margin: 0 0 0.5em;
  }
  & > div {
    color: #888;
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    border-width: 2px;
    border-radius: 2px;
    border-color: #ccc;
    border-style: dashed;
    border-radius: 10px;
    background-color: #f9f9fb;
    outline: none;
    transition: border 0.24s ease-in-out;
    &:focus,
    &:hover {
      border-color: #2196f3;
    }
  }
`;

export const DropZone = StyledComponent;
