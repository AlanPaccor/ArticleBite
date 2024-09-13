import React from 'react';
import { FaCheck } from 'react-icons/fa';

const StarRating = ({ rating, reviews }) => (
  <div className="flex items-center">
    {[1, 2, 3, 4, 5].map((star) => (
      <svg key={star} className={`w-4 h-4 ${star <= Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
    <span className="text-sm text-blue-600 ml-2">({reviews} reviews)</span>
  </div>
);

export const Membership = () => {
  const features = [
    "Free standard shipping*",
    "Free 2-day shipping*",
    "Exclusive member prices on thousands of items",
    "Exclusive access to sales, events and products",
    "Extended 60-day return window on most products*",
    "Protection plans, including AppleCare+*",
    "24/7 tech support",
    "VIP member support",
    "20% off repairs*"
  ];

  const tiers = [
    {
      title: "Basic",
      price: "Free",
      rating: 0,
      reviews: 0,
      buttonText: "Join My Best Buy",
      includedFeatures: [0]
    },
    {
      title: "Pro",
      price: "$49.99/year*",
      rating: 4,
      buttonText: "Add to Cart",
      includedFeatures: [0, 1, 2, 3, 4]
    },
    {
      title: "Business",
      price: "$179.99/year*",
      rating: 4.5,
      buttonText: "Add to Cart",
      includedFeatures: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  ];

  return (
    <div className=" min-h-screen"> {/* Added background color here */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-1"></div>
          {tiers.map((tier, index) => (
            <div key={index} className={`col-span-1 ${index === 2 ? '' : ''} p-4 rounded-t-lg`}>
              <h2 className="text-xl font-bold mb-2">{tier.title}</h2>
              {tier.rating > 0 && <StarRating rating={tier.rating} reviews={tier.reviews} />}
              <p className="text-2xl font-bold my-4">{tier.price}</p>
              <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md mb-2">
                {tier.buttonText}
              </button>
              <p className="text-xs text-gray-600 mb-4">
                {tier.price === "Free" ? "See terms." : "Auto renews. Cancel anytime. See terms."}
              </p>
            </div>
          ))}
          
          {features.map((feature, featureIndex) => (
            <React.Fragment key={featureIndex}>
              <div className="col-span-1 p-4 border-t border-gray-400 ">
                <p>{feature}</p>
              </div>
              {tiers.map((tier, tierIndex) => (
                <div key={`${featureIndex}-${tierIndex}`} className={`col-span-1 p-4 border-t border-gray-300 ${tierIndex === 2 ? '' : ''}`}>
                  {tier.includedFeatures.includes(featureIndex) && <FaCheck className="text-blue-600" />}
                </div>
              ))}
            </React.Fragment>
          ))}
          
          <div className="col-span-1 p-4 border-t border-gray-200"></div>
          {tiers.map((_, index) => (
            <div key={index} className={`col-span-1 p-4 border-t border-gray-200 ${index === 2 ? '' : ''}`}>
              <a href="#" className="text-blue-600">Learn more</a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};