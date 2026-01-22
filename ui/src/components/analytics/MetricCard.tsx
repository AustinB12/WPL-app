import { TrendingDown, TrendingFlat, TrendingUp } from '@mui/icons-material';
import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import type { FC, ReactNode } from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: string;
  icon?: ReactNode;
  subtitle?: string;
}

export const MetricCard: FC<MetricCardProps> = ({
  title,
  value,
  trend,
  icon,
  subtitle,
}) => {
  const getTrendIcon = () => {
    if (!trend) return null;

    const isPositive = trend.startsWith('+');
    const isNegative = trend.startsWith('-');

    if (isPositive) {
      return <TrendingUp sx={{ color: 'success.main', fontSize: 20 }} />;
    } else if (isNegative) {
      return <TrendingDown sx={{ color: 'error.main', fontSize: 20 }} />;
    } else {
      return <TrendingFlat sx={{ color: 'text.secondary', fontSize: 20 }} />;
    }
  };

  const getTrendColor = () => {
    if (!trend) return 'text.secondary';
    return trend.startsWith('+')
      ? 'success.main'
      : trend.startsWith('-')
        ? 'error.main'
        : 'text.secondary';
  };

  return (
    <Card
      sx={{
        height: '100%',
        backgroundImage: `url('data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg"><defs><pattern id="a" width="40" height="40" patternTransform="scale(0.2)" patternUnits="userSpaceOnUse"><rect width="100%" height="100%" fill="none"/><path fill="#2d2d2d33" d="M11 6a5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5 5 5 0 0 1 5 5"/></pattern></defs><rect width="800%" height="800%" fill="url(#a)"/></svg>
     `)}')`,
      }}
    >
      <CardContent>
        <Stack
          direction='row'
          justifyContent='space-between'
          alignItems='flex-start'
          mb={2}
        >
          <Typography variant='body2' color='text.secondary' fontWeight={500}>
            {title}
          </Typography>
          {icon && (
            <Box sx={{ color: 'primary.main', opacity: 0.7 }}>{icon}</Box>
          )}
        </Stack>

        <Typography variant='h4' fontWeight='bold' mb={1}>
          {value.toLocaleString()}
        </Typography>

        <Stack direction='row' alignItems='center' spacing={0.5}>
          {trend && (
            <>
              {getTrendIcon()}
              <Typography
                variant='body2'
                color={getTrendColor()}
                fontWeight={500}
              >
                {trend}
              </Typography>
            </>
          )}
          {subtitle && (
            <Typography
              variant='body2'
              color='text.secondary'
              ml={trend ? 1 : 0}
            >
              {subtitle}
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};
