import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FiSearch, FiCalendar, FiVideo, FiStar } from 'react-icons/fi';

const features = [
  { icon: FiSearch, title: 'Find Expert Mentors', desc: 'Search by skill, price, and rating to find the perfect mentor.' },
  { icon: FiCalendar, title: 'Book Sessions', desc: 'Schedule 1-on-1 or group sessions at your convenience.' },
  { icon: FiVideo, title: 'Live Video Calls', desc: 'Connect via WebRTC video with screen sharing support.' },
  { icon: FiStar, title: 'Rate & Review', desc: 'Build trust through transparent ratings and reviews.' },
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-violet-600 text-white py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Learn Any Skill from<br />Real Experts
          </h1>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Connect with mentors, book sessions, and grow your skills through peer-to-peer learning.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/mentors" className="bg-white text-blue-600 font-semibold py-3 px-8 rounded-xl hover:bg-blue-50 transition-colors">
              Find a Mentor
            </Link>
            <Link to="/signup" className="border-2 border-white text-white font-semibold py-3 px-8 rounded-xl hover:bg-white/10 transition-colors">
              Become a Mentor
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white py-12 border-b">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[['10K+', 'Learners'], ['500+', 'Mentors'], ['50+', 'Skills'], ['4.8★', 'Avg Rating']].map(([val, label]) => (
            <div key={label}>
              <div className="text-3xl font-bold text-blue-600">{val}</div>
              <div className="text-gray-500 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Everything you need to learn</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Icon size={22} className="text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-blue-600 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to start learning?</h2>
        <p className="text-blue-100 mb-8">Join thousands of learners growing their skills every day.</p>
        <Link to="/signup" className="bg-white text-blue-600 font-semibold py-3 px-10 rounded-xl hover:bg-blue-50 transition-colors">
          Get Started Free
        </Link>
      </section>

      <Footer />
    </div>
  );
}
