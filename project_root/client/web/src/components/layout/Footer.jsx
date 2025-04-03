import React from 'react';

function Footer() {
  return (
    <footer style={{ background: '#eee', padding: '10px 20px', textAlign: 'center', marginTop: 'auto' }}>
      <p>&copy; {new Date().getFullYear()} My App. All rights reserved.</p>
    </footer>
  );
}

export default Footer;