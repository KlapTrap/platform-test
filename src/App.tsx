import logo from "./logo.svg";
import styles from "./App.module.css";
import { onMount } from "solid-js";

const handlersMap = new Map<
  string,
  Set<{
    iframe: HTMLIFrameElement;
    handler: (data: unknown, respond: (data: unknown) => void) => void;
  }>
>();

const addListener = (
  iframe: HTMLIFrameElement,
  iframeOrign: string,
  handler: (data: unknown, respond: (data: unknown) => void) => void
) => {
  if (handlersMap.has(iframeOrign)) {
    handlersMap.get(iframeOrign)?.add({ iframe, handler });
  } else {
    handlersMap.set(iframeOrign, new Set([{ iframe, handler }]));
  }
};

const senMessageToIframe = (
  iframeOrId: string | HTMLIFrameElement,
  message: unknown
) => {
  const iframe =
    typeof iframeOrId === "string"
      ? (document.getElementById(iframeOrId) as HTMLIFrameElement)
      : iframeOrId;
  if (iframe) {
    if (origin) {
      const target = new URL(iframe.src).origin;
      iframe.contentWindow?.postMessage(message, target);
    }
  }
};

window.addEventListener("message", (event) => {
  const handler = handlersMap.get(event.origin);
  if (!handler) return;
  handler.forEach(({ handler, iframe }) =>
    handler(event.data, (data) => senMessageToIframe(iframe, data))
  );
});

function App() {
  onMount(async () => {
    const iframeMessageHandler = async (
      iframeId: string,
      handler: (data: unknown, respond: (data: unknown) => void) => void
    ) => {
      const iframe = document.getElementById(iframeId) as HTMLIFrameElement;
      if (iframe) {
        const origin = new URL(iframe.src).origin;
        if (origin) {
          addListener(iframe, origin, handler);
        }
      }
    };

    await iframeMessageHandler("app1", (data) => {
      console.log(`[host] received message from app1: `, data);
    });
    await iframeMessageHandler("app2", (data, respond) => {
      console.error(`[host] received message from app2: `, data);
      if (Math.random() > 0.5) {
        respond("hello from host, I got you");
      }
    });
  });

  return (
    <div class={styles.App}>
      <iframe id="app1" src="http://localhost:3001"></iframe>
      <iframe id="app2" src="http://localhost:3002"></iframe>
      <button onClick={() => senMessageToIframe("app2", "hello")}>Send</button>
    </div>
  );
}

export default App;
