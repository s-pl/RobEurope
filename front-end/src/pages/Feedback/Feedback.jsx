import React from 'react'
import { Link } from 'react-router-dom'
import './Feedback.css'

const sample = [
  {
    id: 1,
    name: 'Nestor García',
    handle: '@nestor.garcia80',
    date: '23 Nov 2021',
    text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit ut aliquam, purus sit amet luctus venenatis, lectus magna fringilla...'
  },
  {
    id: 2,
    name: 'Ángel Lallave',
    handle: '@angel.lallave90',
    date: '23 Nov 2021',
    text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit ut aliquam, purus sit amet luctus venenatis, lectus magna fringilla...'
  },
  {
    id: 3,
    name: 'Samuel Ponce',
    handle: '@samuel.ponce10',
    date: '23 Nov 2021',
    text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit ut aliquam, purus sit amet luctus venenatis, lectus magna fringilla...'
  }
]

export default function Feedback() {
  return (
    <main className="feedback">
      <header className="feedback__header">
        <Link to="/" className="feedback__logo">← Back to Home</Link>
        <h1 className="feedback__title">Feedback</h1>
      </header>

      <section className="feedback__cards">
        <div className="feedback__grid">
          {sample.map((item) => (
            <article key={item.id} className="feedback__card">
              <div className="card__top">
                <div className="avatar" aria-hidden />
                <div className="card__meta">
                  <div className="card__name">{item.name}</div>
                  <div className="card__handle">{item.handle}</div>
                </div>
              </div>

              <div className="card__stars" aria-hidden>
                <span className="star">★ ★ ★ ★ ★</span>
              </div>

              <div className="card__badge">Verified Purchase</div>

              <p className="card__text">{item.text}</p>

              <div className="card__footer">
                <button className="card__more">Show more ▾</button>
                <div className="card__date">{item.date}</div>
              </div>
            </article>
          ))}
        </div>

        <div className="feedback__cta">
          <div className="chev">▾</div>
          <button className="btn btn--primary rate-btn">Rate Us</button>
        </div>
      </section>
    </main>
  )
}
