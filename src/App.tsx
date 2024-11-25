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

      <footer className="mt-12 text-center text-gray-500">
          <p>
            Made by{' '}
            <a
              href="https://chumaoruworks.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold hover:text-gold-light transition-colors"
            >
              Chumaoru Works Creative Club
            </a>
          </p>
          <p className="mt-2">
          We'd love to hear your feedback and suggestions for improvement. Please submit them{' '}
            <a
              href="https://forms.gle/XdEGo3jf3jfZxCeT8"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold-400/80 text-lg"
              aria-label="Submit your feedback and suggestions for improvement"
            >
              here
            </a>.
          </p>
        </footer>
    </div>

    
  );
}

export default App;
