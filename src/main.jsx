import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/colors.css";
import "./styles.css";
import "./styles/flyout-form.css";
import "./styles/auth.css";

document.documentElement.setAttribute("data-theme", "light");
document.documentElement.style.colorScheme = "light";
document.body.style.colorScheme = "light";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
