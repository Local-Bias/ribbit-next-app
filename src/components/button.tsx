import React, { FCX, VFC } from "react";
import styled from "@emotion/styled";

type ContainerProps = React.DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
> &
  Readonly<{}>;
type Props = ContainerProps & Readonly<{}>;

const Component: FCX<Props> = ({ children, ...others }) => (
  <button {...others}>{children}</button>
);

const StyledComponent = styled(Component)`
  border: 0;
  padding: 1em 2em;
  background-color: #fff;
  color: #53718a;
  border-radius: 4px;
  transition: all 250ms ease;
  cursor: pointer;

  box-shadow: 0 2px 3px -1px #0002;
  &:hover {
    box-shadow: 0 3px 5px 0 #0002;
  }
`;

const Container: VFC<ContainerProps> = (props) => {
  return <StyledComponent {...props} />;
};

export const Button = Container;
