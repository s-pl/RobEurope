import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import './SignUp.css'

export default function SignUp() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    school: '',
    country: '',
    agreeTerms: false
  })

  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    if (!formData.password) newErrors.password = 'Password is required'
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
    if (!formData.school.trim()) newErrors.school = 'School is required'
    if (!formData.country) newErrors.country = 'Country is required'
    if (!formData.agreeTerms) newErrors.agreeTerms = 'You must agree to the terms'
    
    return newErrors
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const newErrors = validateForm()
    
    if (Object.keys(newErrors).length === 0) {
      console.log('Sign up data:', formData)
      // TODO: Send to backend
      alert('Welcome to RobEurope!')
    } else {
      setErrors(newErrors)
    }
  }

  return (
    <main className="signup">
      <header className="signup__header">
        <Link to="/" className="signup__logo">
          <span>← Back to Home</span>
        </Link>
        <h1>Sign Up</h1>
      </header>

      <section className="signup__container">
        <div className="signup__form-wrapper">
          <div className="signup__info">
            <h2>Join RobEurope</h2>
            <p>Create your account and start your robotics journey today</p>
          </div>

          <form className="signup__form" onSubmit={handleSubmit}>
            <div className="form__group">
              <label htmlFor="fullName">Full Name</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Your full name"
              />
              {errors.fullName && <span className="form__error">{errors.fullName}</span>}
            </div>

            <div className="form__group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
              />
              {errors.email && <span className="form__error">{errors.email}</span>}
            </div>

            <div className="form__group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
              />
              {errors.password && <span className="form__error">{errors.password}</span>}
            </div>

            <div className="form__group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
              />
              {errors.confirmPassword && <span className="form__error">{errors.confirmPassword}</span>}
            </div>

            <div className="form__group">
              <label htmlFor="school">School</label>
              <input
                type="text"
                id="school"
                name="school"
                value={formData.school}
                onChange={handleChange}
                placeholder="Your school name"
              />
              {errors.school && <span className="form__error">{errors.school}</span>}
            </div>

            <div className="form__group">
              <label htmlFor="country">Country</label>
              <select
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
              >
                <option value="">Select your country</option>
                <option value="es">Spain</option>
                <option value="ch">Switzerland</option>
                <option value="de">Germany</option>
                <option value="fr">France</option>
                <option value="it">Italy</option>
                <option value="other">Other</option>
              </select>
              {errors.country && <span className="form__error">{errors.country}</span>}
            </div>

            <div className="form__group form__group--checkbox">
              <input
                type="checkbox"
                id="agreeTerms"
                name="agreeTerms"
                checked={formData.agreeTerms}
                onChange={handleChange}
              />
              <label htmlFor="agreeTerms">I agree to the Terms of Service and Privacy Policy</label>
              {errors.agreeTerms && <span className="form__error">{errors.agreeTerms}</span>}
            </div>

            <button type="submit" className="btn btn--primary signup__btn">
              Create Account
            </button>

            <p className="signup__login-link">
              Already have an account? <Link to="/">Sign in here</Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  )
}
