import { render } from '@testing-library/react';
import App from './App';
import { describe, it, expect } from 'vitest';
import { GoogleOAuthProvider } from '@react-oauth/google';

describe('App Component', () => {
  it('renders the App component without crashing', () => {
    const { container } = render(
      <GoogleOAuthProvider clientId="test-client-id">
        <App />
      </GoogleOAuthProvider>
    );
    expect(container).toBeInTheDocument();
  });
});
