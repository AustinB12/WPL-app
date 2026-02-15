import { LocationCity } from '@mui/icons-material';
import {
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Grid,
  Skeleton,
  Typography,
} from '@mui/material';
import { memo, useMemo } from 'react';
import { PageContainer, Page_Title } from '../components/common/PageBuilders';
import { useBranches } from '../hooks/use_branches';
import { data_service } from '../services/data_service';
import type { Branch } from '../types/others';
import { useNavigate } from 'react-router-dom';

// Pre-computed skeleton placeholders to avoid array creation on each render
const SKELETON_COUNT = 6;
const SKELETON_ITEMS = Array.from({ length: SKELETON_COUNT }, (_, i) => i);

export function BranchesPage() {
  const { data: branches, isLoading: loading, dataUpdatedAt } = useBranches();
  return (
    <PageContainer scroll={true}>
      <Page_Title title='Branches' Icon_Component={LocationCity} />
      <Grid container spacing={2}>
        {loading &&
          SKELETON_ITEMS.map((index) => (
            <Grid key={index} size={{ xs: 12, sm: 6, md: 4 }}>
              <Skeleton
                variant='rounded'
                width='100%'
                height={200}
                sx={{ borderRadius: 4 }}
              />
            </Grid>
          ))}
        {branches &&
          !loading &&
          branches.map((branch) => (
            <Grid
              sx={{
                borderRadius: 16,
                cornerShape: 'squircle',
                boxShadow: 4,
                overflow: 'clip',
              }}
              key={branch.id}
              size={{ xs: 12, sm: 6, md: 4 }}
            >
              <BranchCard branch={branch} cache_buster={dataUpdatedAt} />
            </Grid>
          ))}
      </Grid>
    </PageContainer>
  );
}

const BranchCard = memo(function BranchCard({
  branch,
  cache_buster,
}: {
  branch: Branch;
  cache_buster?: number;
}) {
  // Memoize image URL computation - only call API URL builder when image_id exists
  const cover_image_url = useMemo(() => {
    if (branch.image_id) {
      const base_url = data_service.get_image_url('BRANCH', branch.id);
      return `${base_url}?v=${cache_buster}`;
    }
    return branch.cover_image;
  }, [branch.id, branch.image_id, branch.cover_image, cache_buster]);

  const nav = useNavigate();

  return (
    <Card
      sx={{
        maxWidth: 555,
      }}
    >
      <CardActionArea onClick={() => nav(`/branch/${branch.id}`)}>
        <CardMedia
          component='img'
          height='140'
          image={cover_image_url}
          loading='lazy'
          alt={`Cover image of ${branch.branch_name}`}
        />
        <CardContent>
          <Typography gutterBottom variant='h5' component='div'>
            {branch.branch_name}
          </Typography>
          <Typography variant='body2' sx={{ color: 'text.secondary' }}>
            {branch.address}
            <br />
            Phone: {branch.phone}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
});
