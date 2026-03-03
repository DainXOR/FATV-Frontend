import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import ApiClient from './api/ApiClient';
import reportWebVitals from './reportWebVitals';


async function startApp() {
  const token = localStorage.getItem('token');
  if (token != null){
    ApiClient.setToken(token);
  }
  await ApiClient.connect();
  
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

startApp();

reportWebVitals();
