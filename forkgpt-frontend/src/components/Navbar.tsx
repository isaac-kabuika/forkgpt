import { Link } from "react-router-dom";

const Navbar: React.FC = () => {
  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-xl font-bold">
                ForkGPT
              </Link>
            </div>
            <div className="ml-6 flex space-x-4 items-center">
              <Link
                to="/threads"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Threads
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            {/* Auth buttons will go here later */}
            <button className="ml-4 px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">
              Sign In
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
