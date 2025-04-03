import React from 'react';
import Navigation from './Navigation'; // Ensure Navigation.tsx exists
import Footer from './Footer'; // Ensure Footer.tsx exists

interface LayoutProps {
  children: React.ReactNode; // Type the children prop
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900"> {/* Added dark mode bg */}
      <Navigation />
      <main className="flex-grow container mx-auto px-4 py-8">
        {/* Page content is rendered here */}
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;