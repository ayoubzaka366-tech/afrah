import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import PackageCard from '../../components/PackageCard';
import LoadingSpinner from '../../components/LoadingSpinner';



export default function Home() {
  const [slides, setSlides] = useState([]);
  const [categories, setCategories] = useState([]);
  const [packages, setPackages] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slideIndex, setSlideIndex] = useState(0);
  const [pkgFilter, setPkgFilter] = useState('');
  const [prodSlide, setProdSlide] = useState(0);

  useEffect(() => {
    if (slides.length === 0) return;
    const timer = setInterval(() => {
      setSlideIndex(prev => (prev + 1) % slides.length);
    }, 10000);
    return () => clearInterval(timer);
  }, [slides]);

  useEffect(() => {
    if (products.length === 0) return;
    const timer = setInterval(() => {
      setProdSlide(prev => (prev + 1) % products.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [products]);

  useEffect(() => {
    Promise.all([
      API.get('/slides'),
      API.get('/categories'),
      API.get('/packages'),
      API.get('/products'),
    ]).then(([slRes, catRes, pkgRes, prRes]) => {
      setSlides(slRes.data);
      setCategories(catRes.data);
      setPackages(pkgRes.data);
      setProducts(prRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div>
      <section className="relative h-[80vh] sm:h-[90vh] overflow-hidden">
        {slides.map((slide, i) => (
          <div key={slide.id}
            className={`absolute inset-0 transition-all duration-1000 ${i === slideIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}>
            <img src={`/uploads/slides/${slide.image}`} alt=""
              className="w-full h-full object-cover"
              fetchpriority={i === 0 ? 'high' : 'low'} />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, i) => (
            <button key={i} onClick={() => setSlideIndex(i)}
              className={`h-2 rounded-full transition-all duration-300 ${i === slideIndex ? 'bg-gold-400 w-8' : 'bg-white/30 hover:bg-white/50 w-2'}`} />
          ))}
        </div>
      </section>

      <section className="py-20 sm:py-28 bg-[#fafafa]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-14">
            <span className="text-xs font-semibold text-gold-600 uppercase tracking-[0.2em]">Portfolio</span>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-gray-900 mt-3">Nos Réalisations</h2>
            <div className="w-10 h-0.5 bg-gold-400 mx-auto mt-4 rounded-full" />
            <p className="text-sm text-gray-400 mt-3">Découvrez nos catégories d'événements</p>
          </div>
          <div className={categories.length > 3
            ? 'flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8'
            : 'grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8'}>
            {categories.map(cat => (
              <Link key={cat.id} to={`/events?category=${cat.id}`}
                className={`block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 group ${categories.length > 3 ? 'min-w-[280px] sm:min-w-[320px] snap-start flex-shrink-0' : ''}`}>
                <div className="h-48 overflow-hidden bg-gradient-to-br from-amber-900 via-stone-800 to-rose-900">
                  {cat.image ? (
                    <img src={`/uploads/categories/${cat.image}`} alt={cat.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-6xl font-display text-white/10 select-none">{cat.title[0]}</span>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-display font-semibold text-gray-900 group-hover:text-gold-600 transition-colors">{cat.title}</h3>
                  {cat.description && <p className="text-sm text-gray-400 mt-1">{cat.description}</p>}
                </div>
              </Link>
            ))}
          </div>
          {categories.length > 0 && (
            <div className="text-center mt-10">
              <Link to="/events" className="inline-flex items-center gap-2 text-sm font-medium text-gray-900 hover:text-gold-600 transition-colors border-b border-gray-300 hover:border-gold-500 pb-0.5">
                Voir tout
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          )}

          {products.length > 0 && (
            <>
              <div className="relative mt-14 overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8">
                <div className="flex gap-5 transition-transform duration-700 ease-in-out px-4 sm:px-6 lg:px-8"
                 style={{ transform: `translateX(-${prodSlide * 260}px)` }}>
                  {products.concat(products).map((pr, i) => (
                    <div key={`${pr.id}-${i}`}
                      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group min-w-[240px] flex-shrink-0">
                      <div className="h-44 overflow-hidden">
                        {pr.image ? (
                          <img src={`/uploads/products/${pr.image}`} alt={pr.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900 flex items-center justify-center">
                            <span className="text-4xl font-display text-white/10">{pr.title[0]}</span>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-display font-semibold text-gray-900 text-sm">{pr.title}</h3>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-bold text-gold-600">{Number(pr.price).toLocaleString()} DH</span>
                          <Link to="/shop" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">Voir</Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-center gap-1.5 mt-6">
                {products.map((_, i) => (
                  <button key={i} onClick={() => setProdSlide(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${i === prodSlide % products.length ? 'bg-gray-900 w-6' : 'bg-gray-200 w-1.5'}`} />
                ))}
              </div>

              <div className="text-center mt-6">
                <Link to="/shop" className="inline-flex items-center gap-2 text-sm font-medium text-gold-600 hover:text-gold-700 transition-colors border-b border-gold-300 hover:border-gold-500 pb-0.5">
                  Voir toute la boutique
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs font-semibold text-gold-600 uppercase tracking-[0.2em]">Tarifs</span>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-gray-900 mt-3">Nos Forfaits</h2>
            <div className="w-10 h-0.5 bg-gold-400 mx-auto mt-4 rounded-full" />
            <p className="text-sm text-gray-400 mt-3">Découvrez nos forfaits par catégorie</p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-10">
            <button onClick={() => setPkgFilter('')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${!pkgFilter ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>
              Tous
            </button>
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setPkgFilter(String(cat.id))}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${pkgFilter === String(cat.id) ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>
                {cat.title}
              </button>
            ))}
          </div>

          {(() => {
            let displayed = packages;
            if (pkgFilter) {
              displayed = packages.filter(p => String(p.category_id) === pkgFilter);
            } else {
              const seen = new Set();
              displayed = [];
              packages.forEach(p => {
                const key = p.category_id || 'null';
                if (!seen.has(key)) { seen.add(key); displayed.push(p); }
              });
            }
            return displayed.length === 0 ? (
              <p className="text-center text-gray-300">Aucun forfait disponible pour le moment.</p>
            ) : (
              <div className={displayed.length > 3
                ? 'flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8'
                : 'grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8'}>
                {displayed.map(pkg => (
                  <div key={pkg.id} className={displayed.length > 3 ? 'min-w-[280px] sm:min-w-[320px] snap-start flex-shrink-0' : ''}>
                    <PackageCard pkg={pkg} />
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </section>

      <section className="py-24 sm:py-32 bg-[#fafafa]">
        <div className="max-w-3xl mx-auto text-center px-4">
          <span className="text-xs font-semibold text-gold-600 uppercase tracking-[0.2em]">Contact</span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-gray-900 mt-3">Prêt à Planifier Votre Événement ?</h2>
          <div className="w-10 h-0.5 bg-gold-400 mx-auto mt-4 rounded-full" />
          <p className="text-sm sm:text-base text-gray-400 mt-4 max-w-md mx-auto">Contactez-nous dès aujourd'hui et réalisons votre célébration de rêve.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/order" className="bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium px-8 py-3.5 rounded-full transition-all shadow-sm hover:shadow-md">
              Réserver maintenant
            </Link>
            <Link to="/contact" className="bg-white hover:bg-gray-50 text-gray-900 text-sm font-medium px-8 py-3.5 rounded-full transition-all border border-gray-200 shadow-sm hover:shadow-md">
              Contactez-nous
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
