import logo from "./logo.svg";
import styles from "./App.module.css";
import { createSignal } from "solid-js";

const waiting = new Map<number, (res: { id: number; data: unknown }) => void>();

const buildSender = () => {
  let id = 0;
  return {
    send: (message: string, responseHandler?: (data: unknown) => void) => {
      window.parent.postMessage({ message, id }, "*");
      if (responseHandler) {
        const timeout = setTimeout(() => {
          console.log(`timeout for message ${id}`);
          waiting.delete(id);
        }, 5000);
        waiting.set(id, ({ data }) => {
          clearTimeout(timeout);
          waiting.delete(id);
          responseHandler(data);
        });
      }
      id++;
    },
  };
};
const sender = buildSender();
const sendPostMessage = (message: string) => {
  sender.send(message, (data) => console.log(`response received ${data}`));
};

setInterval(() => {
  sendPostMessage("Hello from app 2");
}, 1000);

const [message, setMessage] = createSignal(0);

window.addEventListener("message", (event) => {
  console.log("app2 received message: ", event.data);
  setMessage((prev) => prev + 1);
});

function App() {
  return (
    <div class={styles.App}>
      <header class={styles.header}>
        <img src={logo} class={styles.logo} alt="logo" />
        {message()}
        <a
          class={styles.link}
          href="https://github.com/solidjs/solid"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn Solid
        </a>
      </header>
    </div>
  );
}

export default App;
