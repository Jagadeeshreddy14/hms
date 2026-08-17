import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// Opt-in to React Router v7 future flags early to silence warnings and opt-in behavior
window.__react_router_future__ = window.__react_router_future__ || {};
window.__react_router_future__.v7_startTransition = true;
window.__react_router_future__.v7_relativeSplatPath = true;

const root = ReactDOM.createRoot(document.getElementById('root'));

// Import App after setting future flags so react-router reads them on initialization
import('./App').then(({ default: App }) => {
	root.render(<React.StrictMode><App /></React.StrictMode>);
});
