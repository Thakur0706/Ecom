import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { AppProvider } from './context/AppContext';
import { OrderProvider } from './context/OrderContext';
import { ERPCRMProvider } from './context/ERPCRMContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProvider>
        <OrderProvider>
          <ERPCRMProvider>
            <App />
          </ERPCRMProvider>
        </OrderProvider>
      </AppProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
