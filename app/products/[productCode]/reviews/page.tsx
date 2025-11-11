// app/products/[productCode]/reviews/page.tsx
// 상품 리뷰 페이지

import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import ProductReviews from '@/components/mall/ProductReviews';

export default async function ProductReviewsPage({
  params,
}: {
  params: { productCode: string };
}) {
  const { productCode } = params;

  // 상품 정보 조회
  const product = await prisma.cruiseProduct.findUnique({
    where: { productCode },
    select: {
      id: true,
      productCode: true,
      packageName: true,
      cruiseLine: true,
      shipName: true,
      MallProductContent: {
        select: {
          layout: true,
        },
      },
    },
  });

  if (!product) {
    notFound();
  }

  // layout에서 별점과 리뷰 개수 가져오기
  const layout = product.MallProductContent?.layout
    ? (typeof product.MallProductContent.layout === 'string'
        ? JSON.parse(product.MallProductContent.layout)
        : product.MallProductContent.layout)
    : null;

  const rating = layout?.rating || 4.4;
  const reviewCount = layout?.reviewCount || 0;

  return (
    <ProductReviews
      productCode={productCode}
      productName={product.packageName}
      cruiseLine={product.cruiseLine}
      shipName={product.shipName}
      rating={rating}
      reviewCount={reviewCount}
    />
  );
}



