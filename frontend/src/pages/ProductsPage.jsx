import { useEffect, useMemo, useState } from 'react';
import ProductCard from '../components/ProductCard.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import { useCart } from '../context/CartContext.jsx';
import { api } from '../services/api.js';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('default');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { addToCart, cartMessage } = useCart();

  useEffect(() => {
    api.getProducts()
      .then((data) => setAllProducts(data.products))
      .catch((caught) => setError(caught.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let ignore = false;

    setLoading(true);
    setError('');

    api.getProducts(search)
      .then((data) => {
        if (!ignore) setProducts(data.products);
      })
      .catch((caught) => {
        if (!ignore) setError(caught.message);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [search]);

  const categories = useMemo(
    () => ['All', ...new Set(allProducts.map((p) => p.category))], [allProducts]
  );

  const visibleProducts = useMemo(() => {
    const filteredProducts = category === 'All' ? products : products.filter((product) => product.category === category);

    if (sort === 'default')
      return filteredProducts;

    return [...filteredProducts].sort((first, second) => {
      if (sort === 'price-low')
        return Number(first.price) - Number(second.price);
      if (sort === 'price-high')
        return Number(second.price) - Number(first.price);
      
      return first.name.localeCompare(second.name);
    });
  }, [category, products, sort]);

  return (
    <section>
      <div className="hero">
        <div>
          <p className="eyebrow">BSIT FULL-STACK PROJECT</p>
          <h1>Technology for study, work and play</h1>
          <p>Browse the starter catalog, build a cart and complete a simulated order.</p>
        </div>
      </div>

      <div className="toolbar">
        <label>
          <span>Search products</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Try keyboard" />
        </label>
        <label>
          <span>Category</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            {categories.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label>
          <span>Sort</span>
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="default">Default</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="name-az">Name: A to Z</option>
          </select>
        </label>
      </div>

      <StatusMessage>{cartMessage}</StatusMessage>
      {loading && <StatusMessage>Loading products…</StatusMessage>}
      {error && <StatusMessage type="error">{error} Make sure the backend is running.</StatusMessage>}
      {!loading && !error && visibleProducts.length === 0 && <StatusMessage>No products match your filters.</StatusMessage>}

      <div className="product-grid">
        {visibleProducts.map((product) => (
          <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
        ))}
      </div>
    </section>
  );
}
