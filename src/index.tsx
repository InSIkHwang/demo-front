import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { RecoilRoot } from "recoil";
import { ConfigProvider, message } from "antd";

// message 전역 설정
message.config({
  top: 50,
  duration: 4,
});

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <RecoilRoot>
    <ConfigProvider
      getPopupContainer={() => document.getElementById("root") || document.body}
    >
      <App />
    </ConfigProvider>
  </RecoilRoot>
);
