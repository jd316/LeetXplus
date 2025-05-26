import React from "react";
import Icon from "./Icon";

function InfoIcon({ classes, ...rest }) {
  return (
    <Icon classes={classes} {...rest}>
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="12" cy="16" r="0.75" fill="currentColor" />
      </svg>
    </Icon>
  );
}

export default InfoIcon; 