import ArrowRight from '../assets/arrow-right.svg';
import Logo from '../assets/logosaas.png';
import Image from "next/image";
import MenuIcon from '../assets/menu.svg';

export const Header = () => {
  return (
    <header className='sticky top-0 backdrop-blur-sm z-20'>
      <div className="flex justify-center items-center py-3 bg-black text-white text-sm gap-3">
        <p className='text-white/60 hidden md:block'>Generate More Than Website Links, Start on PDF's, Videos and More</p>
        <a href="/memberships" className='inline-flex gap-1 items-center'>
          <p>Get a Membership Now!</p>
          <ArrowRight className="h-4 w-4 inline-flex justify-center items-center" />
        </a>
      </div>
      <div className='py-5'>
        <div className='container'>
          <div className='flex items-center justify-between'>
            <a href="/" aria-label="Homepage">
              <Image src={Logo} alt='SaaS Logo' height={40} width={40}/>
            </a>
            <MenuIcon className="h-5 w-5 md:hidden" />
            <nav className='hidden md:flex gap-6 text-black/60 items-center'>
              <a href='#'>About</a>
              <a href='#'>Features</a>
              <a href='/memberships'>Memberships</a>
              <a href='#'>Reviews</a>
              <a href='/login'>Login</a>
              <a href='/register' className='bg-black text-white px-4 py-2 rounded-lg font-medium inline-flex align-items justify-center tracking-tight'>Register</a>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};
