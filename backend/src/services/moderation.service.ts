import { prisma } from '../lib/prisma';

// Recalculates space's ratingAvg and reviewCount excluding hidden reviews
export async function recalculateSpaceRating(spaceId: string) {
  const aggregate = await prisma.review.aggregate({
    where: {
      spaceId,
      isHidden: false,
    },
    _avg: { overallRating: true },
    _count: { id: true },
  });

  const newAvg = aggregate._avg.overallRating ? Number(aggregate._avg.overallRating.toFixed(2)) : 0;
  const newCount = aggregate._count.id || 0;

  await prisma.space.update({
    where: { id: spaceId },
    data: {
      ratingAvg: newAvg,
      reviewCount: newCount,
    },
  });

  return { ratingAvg: newAvg, reviewCount: newCount };
}

// Fetch review moderation queue filtered by visibility or rating thresholds
export async function getModerationQueue(filter: 'all' | 'hidden' | 'low_rating' = 'all') {
  const whereClause: any = {};
  
  if (filter === 'hidden') {
    whereClause.isHidden = true;
  } else if (filter === 'low_rating') {
    whereClause.overallRating = { lte: 2 };
  }

  return await prisma.review.findMany({
    where: whereClause,
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      space: {
        select: { id: true, name: true, ratingAvg: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

// Toggle review visibility (hide or unhide toxic/fake reviews)
export async function toggleReviewVisibility(reviewId: string, isHidden: boolean) {
  const review = await prisma.review.update({
    where: { id: reviewId },
    data: { isHidden },
  });

  // Recalculate rating average for the space after visibility toggles
  await recalculateSpaceRating(review.spaceId);

  return review;
}

// Rating Anomaly Detector: Identifies spaces with sharp drops in rating averages
export async function getRatingAnomalyAlerts() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Retrieve spaces with at least 3 reviews
  const spaces = await prisma.space.findMany({
    where: { reviewCount: { gte: 3 } },
    include: {
      reviews: {
        where: { isHidden: false },
        select: { overallRating: true, createdAt: true },
      },
    },
  });

  const anomalies = [];

  for (const space of spaces) {
    const recentReviews = space.reviews.filter((r) => new Date(r.createdAt) >= thirtyDaysAgo);
    const olderReviews = space.reviews.filter((r) => new Date(r.createdAt) < thirtyDaysAgo);

    if (recentReviews.length >= 2 && olderReviews.length >= 2) {
      const recentAvg =
        recentReviews.reduce((sum, r) => sum + r.overallRating, 0) / recentReviews.length;
      const historicalAvg =
        olderReviews.reduce((sum, r) => sum + r.overallRating, 0) / olderReviews.length;

      const ratingDrop = historicalAvg - recentAvg;

      // Alert condition: drop >= 1.0 star or historical average >= 4.0 drops to <= 3.0
      if (ratingDrop >= 1.0 || (historicalAvg >= 4.0 && recentAvg <= 3.0)) {
        anomalies.push({
          spaceId: space.id,
          spaceName: space.name,
          historicalAvg: Number(historicalAvg.toFixed(2)),
          recentAvg: Number(recentAvg.toFixed(2)),
          ratingDrop: Number(ratingDrop.toFixed(2)),
          recentCount: recentReviews.length,
          severity: ratingDrop >= 1.5 ? 'CRITICAL' : 'WARNING',
        });
      }
    }
  }

  return anomalies;
}