import logo from "./logo.svg";
import styles from "./App.module.css";
import { createSignal } from "solid-js";

const waiting = new Map<number, (res: { id: number; data: unknown }) => void>();
const [message, setMessage] = createSignal(0);
const [responsesCount, setResponsesCount] = createSignal(0);

const buildSender = () => {
  let id = 0;
  return {
    send: (message: string, responseHandler?: (data: unknown) => void) => {
      setMessage((prev) => prev + 1);
      window.parent.postMessage({ message, id }, "*");
      if (responseHandler) {
        const timeout = setTimeout(() => {
          console.log(`timeout for message ${id}`);
          waiting.delete(id);
        }, 5000);
        waiting.set(id, (data) => {
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
  sender.send(message, (data) => console.log(`response received`, data));
};

setInterval(() => {
  if (Math.random() > 0.3) sendPostMessage("Hello from app 2");
}, 1000);

window.addEventListener("message", (event) => {
  if (waiting.has(event.data.id)) {
    waiting.get(event.data.id)?.(event.data);
    setResponsesCount((prev) => prev + 1);
  }
});

function App() {
  return (
    <div class={styles.App}>
      App 2
      <header class={styles.header}>
        <div>Messages sent: {message()}</div>
        <div>Responses received: {responsesCount()}</div>
      </header>
    </div>
  );
}

export default App;
