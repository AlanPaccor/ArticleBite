import React from 'react';
import { Star } from 'lucide-react';
import Image from 'next/image';
import ArticlePic from '../../assets/ArticlePic.jpg';
import AlgebraPic from '../../assets/Algebra.jpg';

interface FavoritesProps {
  isDarkMode: boolean;
  favorites: string[];
}

const Favorites: React.FC<FavoritesProps> = ({ isDarkMode, favorites }) => {
  const favoriteItems = [
    {
      id: 'article',
      title: 'Scrape Article',
      href: '/generators/ArticleGen',
      image: ArticlePic,
    },
    {
      id: 'algebra',
      title: 'Algebra',
      href: '/generators/Math/Algebra',
      image: AlgebraPic,
    },
    // Add more items as needed
  ].filter(item => favorites.includes(item.id));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {favoriteItems.map((item) => (
        <a
          key={item.id}
          href={item.href}
          className={`${
            isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
          } rounded-lg p-4 h-80 flex flex-col items-center justify-center transition-all duration-300 relative overflow-hidden group`}
        >
          <Image
            src={item.image}
            alt={item.title}
            layout="fill"
            objectFit="cover"
            className="absolute inset-0"
          />
          <div className="absolute inset-0 bg-black opacity-70 group-hover:opacity-30 transition-opacity duration-300"></div>
          <div className="relative z-10 flex flex-col items-center">
            <span className="text-center text-white font-semibold">{item.title}</span>
          </div>
          <Star className="absolute bottom-2 right-2 z-20 w-6 h-6 text-yellow-400 fill-current" />
        </a>
      ))}
    </div>
  );
};

export default Favorites;
