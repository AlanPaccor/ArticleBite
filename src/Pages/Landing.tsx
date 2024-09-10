import React from 'react'; // Import React explicitly
import '../CSS/Landing.css';
import LogoutButton from '../Components/LogoutButton';

const Landing: React.FC = () => {
  return (
    <div className="LandingContainer">
      <a className='uploadLButton' href='/uploadlink'>
        Get Notes!
      </a>
      <LogoutButton />
    </div>
  );
}

export default Landing;
