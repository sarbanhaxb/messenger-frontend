// ЗАПУСК ПРИЛОЖЕНИЯ
// ReactDOM.createRoot() - создает корневой элемент для React
// document.getElementById('root') - находит элемент <div id = "root"> в index.html
// .render() - рендерит компонент в этот элемент
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from "./App";

import './index.css'

ReactDOM.createRoot(document.getElementById("root")).render(
  // React.StrictMode — режим разработки для проверки потенциальных проблем
  // В production режиме он автоматически отключается
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
