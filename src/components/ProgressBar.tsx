"use client";
import { AppProgressBar } from "next-nprogress-bar";

export default function ProgressBar() {
  return (
    <AppProgressBar
      height="3px"
      color="#BB162B"
      options={{ showSpinner: false }}
      shallowRouting
    />
  );
}
