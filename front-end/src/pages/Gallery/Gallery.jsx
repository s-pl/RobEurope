import React from 'react'
import { Link } from 'react-router-dom'
import './Gallery.css'

export default function Gallery() {
  const images = [
    { id: 1, title: 'Competition 2024', category: 'Event' },
    { id: 2, title: 'Team Work', category: 'Team' },
    { id: 3, title: 'Robot Design', category: 'Technology' },
    { id: 4, title: 'International Students', category: 'Community' },
    { id: 5, title: 'Award Ceremony', category: 'Event' },
    { id: 6, title: 'Workshop Session', category: 'Learning' },
  ]

  return (
    <main className="gallery">
      <header className="gallery__header">
        <Link to="/" className="gallery__logo">
          <span>← Back to Home</span>
        </Link>
        <h1>Gallery</h1>
      </header>

      <section className="gallery__container">
        <div className="gallery__grid">
          {images.map((image) => (
            <div key={image.id} className="gallery__item">
              <div className="gallery__image-placeholder">
                <span>{image.title}</span>
              </div>
              <div className="gallery__info">
                <h3>{image.title}</h3>
                <p>{image.category}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
