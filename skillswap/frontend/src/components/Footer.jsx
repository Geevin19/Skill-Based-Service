import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">SS</span>
              </div>
              <span className="text-white font-bold">SkillSwap</span>
            </div>
            <p className="text-sm">Peer-to-peer skill learning platform connecting mentors and learners worldwide.</p>
          </div>
          <div>
            <h4 className="text-white font-medium mb-3">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/mentors" className="hover:text-white transition-colors">Find Mentors</Link></li>
              <li><Link to="/signup" className="hover:text-white transition-colors">Become a Mentor</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-3">Account</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/login" className="hover:text-white transition-colors">Login</Link></li>
              <li><Link to="/signup" className="hover:text-white transition-colors">Sign Up</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-3">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><span className="hover:text-white cursor-pointer">Privacy Policy</span></li>
              <li><span className="hover:text-white cursor-pointer">Terms of Service</span></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-6 text-center text-sm">
          © {new Date().getFullYear()} SkillSwap. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
