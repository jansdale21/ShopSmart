import { useState } from 'react';
import { Link } from 'react-router-dom';
import StatusMessage from '../components/StatusMessage.jsx';
import { api } from '../services/api.js';

export default function AssistantPage() {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function ask(event) {
    event.preventDefault();

    setError('');
    setResult(null);
    setLoading(true);

    try {
      const data = await api.askAssistant(question);
      setResult(data);
    } catch (caught) {
      setError(caught.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="assistant-layout">
      <div>
        <p className="eyebrow">SHOPSMART ASSISTANT</p>

        <h1>Find the right product</h1>

        <p>
          Ask about products, prices, comparisons, or product details.
          Recommendations are checked against the ShopSmart catalog.
          If information cannot be verified, the assistant will say so.
        </p>

        <form onSubmit={ask}>
          <label>
            Your question

            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              minLength="3"
              maxLength="300"
              placeholder="Which keyboard do you recommend under 2000 pesos?"
              required
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? 'Checking catalog…' : 'Ask ShopSmart'}
          </button>
        </form>
      </div>

      <div className="assistant-answer">
        <h2>Assistant response</h2>

        <StatusMessage type="error">
          {error}
        </StatusMessage>

        {loading && (
          <p role="status">
            Checking available catalog information…
          </p>
        )}

        {!result && !error && !loading && (
          <p>Your answer will appear here.</p>
        )}

        {result && (
          <>
            <p>{result.answer}</p>

            {result.recommendedProducts.length > 0 && (
              <>
                <h3>Matching products &amp; catalog sources</h3>

                <div className="recommendations">
                  {result.recommendedProducts.map((product) => (
                    <Link
                      key={product.id}
                      to={`/products/${product.id}`}
                    >
                      {product.name} — ₱
                      {Number(product.price).toLocaleString('en-PH')}
                    </Link>
                  ))}
                </div>

                <p>
                  Click a product to view its ShopSmart catalog
                  details and verify the recommendation.
                </p>
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
}