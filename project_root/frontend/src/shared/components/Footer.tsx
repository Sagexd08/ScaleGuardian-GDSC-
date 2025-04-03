import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 dark:bg-gray-900 text-gray-400 py-6 mt-auto">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm">
          &copy; {currentYear} MyApp. All rights reserved.
        </p>
        {/* Optional: Add links */}
        {/* <div className="mt-2">
          <a href="/terms" className="text-gray-400 hover:text-white px-2">Terms</a>
          <a href="/privacy" className="text-gray-400 hover:text-white px-2">Privacy</a>
        </div> */}
      </div>
    </footer>
  );
};

export default Footer;
