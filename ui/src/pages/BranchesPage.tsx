import { LocationCity } from "@mui/icons-material";
import {
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Grid,
  Typography,
} from "@mui/material";
import { PageContainer, PageTitle } from "../components/common/PageBuilders";
import { useBranches } from "../hooks/useBranches";
import type { Branch } from "../types";

export function BranchesPage() {
  const { data: branches, isLoading: loading } = useBranches();
  return (
    <PageContainer>
      <PageTitle title="Branches" Icon_Component={LocationCity} />
      <Grid container spacing={2}>
        {branches &&
          !loading &&
          branches.map((branch) => (
            <Grid
              sx={{
                borderRadius: 16,
                cornerShape: "squircle",
                boxShadow: 4,
                overflow: "clip",
              }}
              key={branch.id}
              size={{ xs: 12, sm: 6, md: 4 }}
            >
              <BranchCard branch={branch} />
            </Grid>
          ))}
      </Grid>
    </PageContainer>
  );
}

function BranchCard({ branch }: { branch: Branch }) {
  return (
    <Card
      sx={{
        maxWidth: 555,
      }}
    >
      <CardActionArea href={`/branch/${branch.id}`}>
        <CardMedia
          component="img"
          height="140"
          image={branch?.cover_image}
          loading="lazy"
          alt={`Cover image of ${branch.branch_name}`}
        />
        <CardContent>
          <Typography gutterBottom variant="h5" component="div">
            {branch.branch_name}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {branch.address}
            <br />
            Phone: {branch.phone}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
