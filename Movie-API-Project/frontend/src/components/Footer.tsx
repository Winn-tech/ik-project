
import React from "react";
import { Link } from "react-router-dom";
import { Film, Github, Twitter, Instagram, Mail } from "lucide-react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-flicks-dark border-t border-flicks-teal/30 py-8 text-flicks-light mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <Film className="w-6 h-6 text-flicks-teal" />
              <span className="text-xl font-bold">Flicks<span className="text-flicks-teal">Lounge</span></span>
            </Link>
            <p className="text-sm text-flicks-light/80">
              Track your favorite movies and TV shows with FlicksLounge. Create your personalized watchlist, rate content, and discover new favorites.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4">Explore</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/movies" className="text-flicks-light/80 hover:text-flicks-teal transition-colors">
                  Movies
                </Link>
              </li>
              <li>
                <Link to="/tv" className="text-flicks-light/80 hover:text-flicks-teal transition-colors">
                  TV Shows
                </Link>
              </li>
              <li>
                <Link to="/cinemas" className="text-flicks-light/80 hover:text-flicks-teal transition-colors">
                  Cinemas
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4">Account</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/profile" className="text-flicks-light/80 hover:text-flicks-teal transition-colors">
                  Profile
                </Link>
              </li>
              <li>
                <Link to="/watchlist" className="text-flicks-light/80 hover:text-flicks-teal transition-colors">
                  Watchlist
                </Link>
              </li>
              <li>
                <Link to="/favorites" className="text-flicks-light/80 hover:text-flicks-teal transition-colors">
                  Favorites
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4">Connect</h3>
            <div className="flex space-x-4">
              <a href="#" className="text-flicks-light/80 hover:text-flicks-teal">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="text-flicks-light/80 hover:text-flicks-teal">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-flicks-light/80 hover:text-flicks-teal">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-flicks-light/80 hover:text-flicks-teal">
                <Mail className="h-5 w-5" />
              </a>
            </div>
            <p className="mt-4 text-sm text-flicks-light/60">
              Contact us at: <a href="mailto:info@flickslounge.com" className="text-flicks-teal">info@flickslounge.com</a>
            </p>
          </div>
        </div>

        <div className="border-t border-flicks-teal/30 mt-8 pt-6 text-center text-sm text-flicks-light/60">
          <p>&copy; {new Date().getFullYear()} FlicksLounge. All rights reserved.</p>
          {/* <p className="mt-1">
            Powered by TMDB API. This product uses the TMDB API but is not endorsed or certified by TMDB.
          </p> */}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
