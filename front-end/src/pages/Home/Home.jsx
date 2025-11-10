import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import './Home.css'
import robotImg from '../../assets/logo2-removebg-preview.png'
import logoImg from '../../assets/image-removebg-preview-logo.png'

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false)

  const toggleMenu = () => {
    setMenuOpen(!menuOpen)
  }

  return (
    <main className="home">
      <header className="home__nav">
        <Link to="/" className="logo-link">
          <img src={logoImg} alt="RobEurope Logo" className="logo-img" />
        </Link>
        <nav className={`home__nav-menu ${menuOpen ? 'active' : ''}`}>
          <Link to="/">Home</Link>
          <Link to="/gallery">Gallery</Link>
          <Link to="/feedback">Feedback</Link>
          <a href="#how-to-prepare">How to prepare</a>
        </nav>
        <div className="home__actions">
          <input className="search" placeholder="Search..." />
          <Link to="/signup" className="btn btn--ghost">Sign up</Link>
        </div>
        <div className="home__hamburger" onClick={toggleMenu}>
          <span className={menuOpen ? 'active' : ''}></span>
          <span className={menuOpen ? 'active' : ''}></span>
          <span className={menuOpen ? 'active' : ''}></span>
        </div>
      </header>

      <section className="home__content">
        <div className="home__left">
          <h1 className="title">ROBEUROPE</h1>
          <p className="subtitle">International robotics challenge for high schools</p>

          <div className="tagline">create <span className="dot">·</span> code <span className="dot">·</span> compete</div>

          <div className="features">
            <div className="feature">
              <div className="feature__icon"></div>
              <div>
                <h4>Develop STEM Skills</h4>
                <p>Learn hands-on about, coding, and design.</p>
              </div>
            </div>

            <div className="feature">
              <div className="feature__icon"></div>
              <div>
                <h4>Create a European Network</h4>
                <p>Connect with students and mentors from across the continent.</p>
              </div>
            </div>

            <div className="feature">
              <div className="feature__icon"></div>
              <div>
                <h4>Boost Your Professional Future</h4>
                <p>Gain international experience that stands out on your CV.</p>
              </div>
            </div>
          </div>

          <div className="home__cta">
            <button className="btn btn--primary">Learn More</button>
          </div>
        </div>

        <div className="home__right">
          <div className="blob" aria-hidden />
          <img src={robotImg} className="robot" alt="robot graphic" aria-hidden />
        </div>
      </section>

      {/* STREAMING */}
      <section className="home__streaming">
        <div className="streaming__container">
          <div className="streaming__left">
            <h2 className="streaming__title">STREAMING</h2>
            <p className="streaming__subtitle">
              Watch all <span className="highlight">RobEurope</span> competitions<br />on live and recorded!
            </p>
          </div>
          <div className="streaming__right">
            <h3 className="events__title">Our lasts events:</h3>
            <div className="events__list">
              <div className="event__item">
                <div className="event__flag">🇨🇭</div>
                <div className="event__info">
                  <p className="event__name">CH, IDM Thun</p>
                  <p className="event__time">run1 10:20 am - run2 12:20 pm</p>
                </div>
              </div>
              <div className="event__item">
                <div className="event__flag">🇪🇸</div>
                <div className="event__info">
                  <p className="event__name">ES, IES El Rincon Las Palmas</p>
                  <p className="event__time">run1 09:20 am - run2 11:20 pm</p>
                </div>
              </div>
              <div className="event__item">
                <div className="event__flag">🇩🇪</div>
                <div className="event__info">
                  <p className="event__name">DE, BBS Jever</p>
                  <p className="event__time">run1 10:20 am - run2 12:20 pm</p>
                </div>
              </div>
            </div>
            <button className="btn btn--primary streaming__btn">Start Watching</button>
          </div>
        </div>
      </section>

{/* INSCRIPTION */}
      <section className="home__inscription">
        <h2 className="inscription__title">INSCRIPTION</h2>
        <div className="inscription__container">
          <div className="inscription__visual">
            <div className="profiles__container">
              <div className="profile profile--top-left"></div>
              <div className="profile profile--top-right"></div>
              <div className="profile profile--middle-left"></div>
              <div className="profile profile--middle-right"></div>
              <div className="profile profile--bottom-left"></div>
              <div className="profile profile--bottom-right"></div>
              <div className="mockup mockup--left"></div>
              <div className="mockup mockup--right"></div>
            </div>
          </div>
          <div className="inscription__content">
            <h3 className="inscription__subtitle">Build & Manage Teams</h3>
            <p className="inscription__description">
              The ultimate platform for student robotics teams. Create your team, connect with other participants, and get ready to take on exciting robotics challenges. Design, build and program a robot capable of navigating obstacles and reaching the finish line — teamwork starts here.
            </p>
            <button className="btn btn--primary">Get Started</button>
          </div>
        </div>
      </section>


{/* ARCHIVE */}
      <section className="home__archive">
        <div className="archive__container">
          <h2 className="archive__title">ARCHIVE</h2>
          <div className="archive__year-selector">
            <span className="year">2025</span>
            <span className="year-nav">›</span>
          </div>
          <p className="archive__description">
            View all RobEurope editions and re-discover all competition information for the upcoming events
          </p>
          <div className="archive__button-container">
            <button className="btn btn--primary">Explore Archive</button>
          </div>
        </div>
      </section>
    </main>
  )
}
