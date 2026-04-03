import { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import PageLoader from '../components/ui/page-loader';

/**
 * Register page — redirects to Auth0 Universal Login (signup screen).
 * Auth0 handles account creation, email verification, and OAuth signup.
 */
export default function Register() {
  const { loginWithRedirect, isAuthenticated } = useAuth0();

  useEffect(() => {
    if (!isAuthenticated) {
      loginWithRedirect({
        authorizationParams: {
          audience: import.meta.env.VITE_AUTH0_AUDIENCE,
          screen_hint: 'signup',
        },
      });
    }
  }, [isAuthenticated, loginWithRedirect]);

  return <PageLoader />;
}
