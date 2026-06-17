import '../src/index.css';
import '../src/App.css';
import ClientLayout from '../components/ClientLayout';

export const metadata = {
  title: 'Woora Investment Admin',
  description: 'WOORA Group Investment Admin Panel',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
