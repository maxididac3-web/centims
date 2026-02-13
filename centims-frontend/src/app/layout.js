import { AuthProvider } from '@/lib/AuthContext';
import './globals.css';

export const metadata = {
  title: 'Centims - Tokens catalans. Apren jugant.',
  description: 'Compra, observa i apren amb un mercat ludic de tokens inspirats en cultura catalana.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ca">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
