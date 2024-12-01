import { FloatingIcons } from './components/FloatingIcons';
import { AdvisorForm } from './components/AdvisorForm';
import { AuthProvider } from './context/AuthContext'; // Create and import AuthProvider

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white">
        <FloatingIcons />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gold-400 to-gold-600  bg-clip-text">
              {' '}
              Personalized Investment Portfolio Advisor
            </h1>
            <p className="text-gold-400/80 text-lg">
              Let us help you build a portfolio that matches your goals and risk
              tolerance
            </p>
          </div>
          <AdvisorForm />
        </div>
      </div>
    </AuthProvider>
  );
}

export default App;
