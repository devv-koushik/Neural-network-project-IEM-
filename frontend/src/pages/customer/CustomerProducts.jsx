import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/Layout';
import { ProductsBody } from '../public/Products';
import { getProducts } from '../../services/api';

export default function CustomerProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProducts().then((data) => {
      setProducts(data);
      setLoading(false);
    });
  }, []);

  return (
    <DashboardLayout
      role="customer"
      title="Store Products"
      subtitle="Explore curated catalog, filter by category, and enjoy instant checkout"
    >
      <ProductsBody products={products} loading={loading} />
    </DashboardLayout>
  );
}
