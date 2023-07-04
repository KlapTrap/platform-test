import logo from "./logo.svg";
import styles from "./App.module.css";

const sendPostMessage = (message) => {
  window.parent.postMessage(message, "*");
};

setInterval(() => {
  if (Math.random() > 0.3) sendPostMessage("Hello from app 1");
}, 5000);

function App() {
  return <div class={styles.App}>App 1</div>;
}

export default App;
