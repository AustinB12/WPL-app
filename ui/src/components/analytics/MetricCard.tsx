import { Card, CardContent, Typography, Box, Stack } from '@mui/material';
import { TrendingUp, TrendingDown, TrendingFlat } from '@mui/icons-material';
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
    <Card sx={{ height: '100%' }}>
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
