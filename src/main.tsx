import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import '@icon-park/react/styles/index.css'
import './index.css'
import 'antd/dist/reset.css'  // Ant Design V6 样式
import './antd-override.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
