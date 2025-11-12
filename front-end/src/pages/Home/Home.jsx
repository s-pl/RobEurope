import React from 'react'
import './Home.css'
import robotImg from '../../assets/logo2-removebg-preview.png'
import logoImg from '../../assets/image-removebg-preview-logo.png'

export default function Home() {
  return (
    <main className="home">
      <header className="home__nav">
        <img src={logoImg} alt="RobEurope Logo" className="logo-img" />
        <nav>
          <a>Home</a>
          <a>Gallery</a>
          <a>Feedback</a>
          <a>How to prepare</a>
        </nav>
        <div className="home__actions">
          <input className="search" placeholder="Search..." />
          <button className="btn btn--ghost">Sign up</button>
        </div>
      </header>

      <section className="home__content">
        <div className="home__left">
          <h1 className="title">ROBEUROPE</h1>
          <p className="subtitle">International robotics challenge for high schools</p>

          <div className="tagline">create <span className="dot">·</span> code <span className="dot">·</span> compete</div>

          <div className="features">
            <div className="feature">
              <div className="feature__icon">📚</div>
              <div>
                <h4>Develop STEM Skills</h4>
                <p>Learn hands-on about, coding, and design.</p>
              </div>
            </div>

            <div className="feature">
              <div className="feature__icon">🌍</div>
              <div>
                <h4>Create a European Network</h4>
                <p>Connect with students and mentors from across the continent.</p>
              </div>
            </div>

            <div className="feature">
              <div className="feature__icon">🚀</div>
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
    </main>
  )
}
