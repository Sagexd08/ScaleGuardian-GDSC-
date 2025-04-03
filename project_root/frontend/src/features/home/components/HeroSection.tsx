import React from 'react';
import { Link } from 'react-router-dom'; // Use Link for internal navigation

interface HeroSectionProps {
  title: string;
  subtitle: string;
  ctaText?: string; // Optional
  ctaLink?: string; // Optional
  imageUrl?: string; // Optional background image URL
}

const HeroSection: React.FC<HeroSectionProps> = ({ title, subtitle, ctaText, ctaLink, imageUrl }) => {
  return (
    <div className={`relative pt-16 pb-20 flex content-center items-center justify-center min-h-[60vh] md:min-h-[75vh] ${imageUrl ? '' : 'bg-gradient-to-r from-blue-500 to-purple-600'}`}>
      {/* Optional Background Image */}
      {imageUrl && (
        <div
          className="absolute top-0 w-full h-full bg-center bg-cover"
          style={{ backgroundImage: `url('${imageUrl}')` }}
        >
          {/* Optional overlay */}
          <span id="blackOverlay" className="w-full h-full absolute opacity-50 bg-black"></span>
        </div>
      )}

      {/* Content */}
      <div className="container relative mx-auto px-4">
        <div className="items-center flex flex-wrap">
          <div className="w-full lg:w-8/12 px-4 ml-auto mr-auto text-center">
            <div className={imageUrl ? 'text-white' : 'text-white'}> {/* Adjust text color if needed based on bg */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4">
                {title}
              </h1>
              <p className="mt-4 text-lg md:text-xl lg:text-2xl text-gray-200 mb-8">
                {subtitle}
              </p>
              {ctaText && ctaLink && (
                <Link
                  to={ctaLink}
                  className="bg-white text-blue-600 hover:bg-gray-100 dark:text-blue-800 dark:hover:bg-gray-200 text-md font-semibold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition duration-200 uppercase"
                >
                  {ctaText}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
       {/* Optional: Scroll down indicator or subtle animation */}
    </div>
  );
};

export default HeroSection;