import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-neutral-50 text-slate-900">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl space-y-10 px-4 pb-16 pt-10 lg:px-0">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
