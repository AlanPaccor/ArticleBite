import React from 'react';
import Image from 'next/image';
import ArticlePic from '../../assets/ArticlePic.jpg';
import { Star } from 'lucide-react';

interface FavoritesProps {
  isDarkMode: boolean;
  favorites: string[];
}

const Favorites: React.FC<FavoritesProps> = ({ isDarkMode, favorites }) => {
  if (favorites.length === 0) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          No favorites selected yet. Star items to add them to your favorites!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {favorites.includes('article') && (
        <a
          href="/upload"
          className={`${
            isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
          } rounded-lg p-4 h-80 flex flex-col items-center justify-center transition-all duration-300 relative overflow-hidden group`}
          style={{
            backgroundImage: `url(${ArticlePic.src})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-black opacity-70 group-hover:opacity-30 transition-opacity duration-300"></div>
          <div className="relative z-10 flex flex-col items-center">
            <svg
              className={`w-12 h-12 mb-2 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="text-center text-white font-semibold">Scrape Article</span>
          </div>
          <Star className="absolute bottom-2 right-2 w-6 h-6 text-yellow-400 fill-current" />
        </a>
      )}
    </div>
  );
};

export default Favorites;
