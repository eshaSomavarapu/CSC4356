
SELECT
  DISTINCT
    restaurant_id,
    percentile_cont(0.25) within group (order by price asc)
        over (partition by restaurant_id) as pricePercentile_25,
    percentile_cont(0.50) within group (order by price asc)
        over (partition by restaurant_id) as pricePercentile_50,
    percentile_cont(0.75) within group (order by price asc)
        over (partition by restaurant_id) as pricePercentile_75
from rawData
order by 1
