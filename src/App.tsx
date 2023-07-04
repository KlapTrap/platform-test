import logo from "./logo.svg";
import styles from "./App.module.css";
import { onMount } from "solid-js";
import {
  ResponsePackage,
  messageBus,
  messageSenderRegistry,
} from "../platform/message-bus/host-message-router";

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
    const target = new URL(iframe.src).origin;
    iframe.contentWindow?.postMessage(message, target);
  }
};

window.addEventListener("message", (event) => {
  const handler = handlersMap.get(event.origin);
  if (!handler) return;
  handler.forEach(({ handler, iframe }) => {
    if (event.source === iframe.contentWindow) {
      handler(event.data, (data) => senMessageToIframe(iframe, data));
    }
  });
});

function App() {
  onMount(async () => {
    const iframeMessageHandler = (
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
    messageSenderRegistry.add(
      document.getElementById("app2") as HTMLIFrameElement
    );
    messageSenderRegistry.add(
      document.getElementById("app3") as HTMLIFrameElement
    );
    // Fake handler
    messageBus.listenToMessages().subscribe((m) => {
      const claim = Math.random() >= 0.8;
      if (claim) {
        const message = m.claim();
        if (message) {
          messageBus.push(
            new ResponsePackage("first handler got you", m, message)
          );
        }
      }
    });

    //Fake handler,
    messageBus.listenToMessages().subscribe((m) => {
      if (Math.random() >= 0.5) {
        const message = m.claim();
        if (message) {
          messageBus.push(
            new ResponsePackage("second handler got you", m, message)
          );
        }
      }
    });
  });

  return (
    <div class={styles.App}>
      <iframe id="app1" src="http://localhost:3001"></iframe>
      <iframe id="app2" src="http://localhost:3002"></iframe>
      <iframe id="app3" src="http://localhost:3002"></iframe>
      <button onClick={() => senMessageToIframe("app2", "hello")}>Send</button>
    </div>
  );
}

export default App;
