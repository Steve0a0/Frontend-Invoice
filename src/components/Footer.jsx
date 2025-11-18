// components/Footer.jsx
import { FaHeart } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-gray-800/50 border-t border-gray-700 text-gray-400 px-6 py-6 mt-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-3 text-sm">
          <p className="text-gray-500">
            &copy; {new Date().getFullYear()} FreeInvoice Pro. All rights reserved.
          </p>
          <p className="text-gray-500 flex items-center gap-1">
            Made with <FaHeart className="text-red-500 text-xs animate-pulse" /> for freelancers worldwide
          </p>
        </div>
      </div>
    </footer>
  );
}

