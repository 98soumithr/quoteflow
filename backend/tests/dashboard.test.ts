describe('Dashboard conversion rate calculation', () => {
  // Helper function to calculate conversion rate (matching route logic)
  const calculateConversionRate = (totalQuotes: number, acceptedQuotes: number): number => {
    return totalQuotes > 0 ? Math.round((acceptedQuotes / totalQuotes) * 100) : 0;
  };

  describe('conversionRate calculation', () => {
    test('should return 0 when totalQuotes is 0 (no division by zero)', () => {
      const result = calculateConversionRate(0, 0);
      expect(result).toBe(0);
    });

    test('should return 0 when acceptedQuotes is 0', () => {
      const result = calculateConversionRate(5, 0);
      expect(result).toBe(0);
    });

    test('should return 100 when all quotes are accepted', () => {
      const result = calculateConversionRate(4, 4);
      expect(result).toBe(100);
    });

    test('should round correctly for fractional percentages', () => {
      // 1/3 = 0.333... -> rounds to 33
      const result = calculateConversionRate(3, 1);
      expect(result).toBe(33);
    });

    test('should handle partial acceptance', () => {
      // 2/5 = 0.4 = 40%
      const result = calculateConversionRate(5, 2);
      expect(result).toBe(40);
    });

    test('should round up when appropriate', () => {
      // 3/7 = 0.428... -> rounds to 43
      const result = calculateConversionRate(7, 3);
      expect(result).toBe(43);
    });
  });

  describe('monthlyRevenue null handling', () => {
    test('null monthly revenue should default to 0', () => {
      // Simulating Prisma aggregate result with null
      const aggregateResult = {
        _sum: {
          totalPaise: null,
        },
      };

      const monthlyRevenue = aggregateResult._sum.totalPaise ?? 0;
      expect(monthlyRevenue).toBe(0);
    });

    test('zero monthly revenue should remain 0', () => {
      const aggregateResult = {
        _sum: {
          totalPaise: 0,
        },
      };

      const monthlyRevenue = aggregateResult._sum.totalPaise ?? 0;
      expect(monthlyRevenue).toBe(0);
    });

    test('positive monthly revenue should be preserved', () => {
      const aggregateResult = {
        _sum: {
          totalPaise: 50000,
        },
      };

      const monthlyRevenue = aggregateResult._sum.totalPaise ?? 0;
      expect(monthlyRevenue).toBe(50000);
    });
  });
});
