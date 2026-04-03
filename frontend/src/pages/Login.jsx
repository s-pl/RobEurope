import { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import PageLoader from '../components/ui/page-loader';

/**
 * Login page — immediately redirects to Auth0 Universal Login.
 * Auth0 handles email/password, Google, GitHub, etc.
 */
export default function Login() {
  const { loginWithRedirect, isAuthenticated } = useAuth0();

  useEffect(() => {
    if (!isAuthenticated) {
      loginWithRedirect({
        authorizationParams: {
          audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        },
      });
    }
  }, [isAuthenticated, loginWithRedirect]);

  return <PageLoader />;
}
