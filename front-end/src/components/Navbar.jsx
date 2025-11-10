import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/">Home</Link>
      <Link to="/gallery">Gallery</Link>
      <Link to="/feedback">Feedback</Link>
      <Link to="/signup">Sign Up</Link>
    </nav>
  );
}

export default Navbar;
