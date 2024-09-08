import '../CSS/Landing.css';
import LogoutButton from '../Components/LogoutButton.js';

function Landing() {
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
