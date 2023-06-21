import logo from './logo.svg';
import styles from './App.module.css';

const sendPostMessage = (message) => {
    window.parent.postMessage(message, "*");
};

setInterval(() => {
    sendPostMessage("Hello from app 1");
}, 5000);


function App() {

  return (
    <div class={styles.App}>
      <header class={styles.header}>
        <img src={logo} class={styles.logo} alt="logo" />
        <p>
          Edit <code>src/App.jsx</code> and save to reload.
        </p>
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
