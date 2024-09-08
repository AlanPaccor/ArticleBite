import { auth } from '../firebase-config';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import './LogoutButton.css';

export default function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('previousLocation'); // Clear previous location
      navigate('/'); // Redirect to homepage
    } catch (error) {
      console.error('Error logging out:', error.message);
    }
  };

  return (
    <button className='logoutButton' onClick={handleLogout}>Logout</button>
  );
}
