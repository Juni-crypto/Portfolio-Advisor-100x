import { FloatingIcons } from './components/FloatingIcons';
import { AdvisorForm } from './components/AdvisorForm';

function App() {
  return (
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
  );
}

export default App;
