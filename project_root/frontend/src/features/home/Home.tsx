import React from 'react';
import HeroSection from './components/HeroSection'; // Assuming HeroSection.tsx exists or is refactored

// Import other sections for the home page as needed
// import FeatureHighlight from './components/FeatureHighlight';
// import CallToAction from './components/CallToAction';

const Home: React.FC = () => {
  return (
    <div className="space-y-12 md:space-y-16 lg:space-y-20">
      {/* Hero Section */}
      <HeroSection
        title="Welcome to Our Decentralized Platform"
        subtitle="Empowering community decisions through transparent governance."
        ctaText="Explore Proposals"
        ctaLink="/governance"
        // Optional: Add background image or other props
      />

      {/* Placeholder for other Home Page Sections */}
      {/* <section className="container mx-auto px-4">
        <h2 className="text-2xl font-semibold text-center mb-8">Key Features</h2>
        {/* Render FeatureHighlight components *\/}
      </section> */}

      {/* <section className="bg-gray-100 py-12">
        <div className="container mx-auto px-4">
         <CallToAction />
        </div>
      </section> */}
    </div>
  );
};

export default Home;