import React from 'react';
import { ShieldCheck } from 'lucide-react'; // Example icon import

function Header() {
  return (
    <header style={{ background: '#eee', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
         <ShieldCheck size={24} style={{ marginRight: '10px' }} />
         <h1>My App</h1>
      </div>
      <nav>
        {/* Basic navigation links - consider using Link from react-router-dom */}
        <a href="/" style={{ marginRight: '15px' }}>Home</a>
        <a href="/dashboard" style={{ marginRight: '15px' }}>Dashboard</a>
        <a href="/governance">Governance</a>
      </nav>
    </header>
  );
}

export default Header;