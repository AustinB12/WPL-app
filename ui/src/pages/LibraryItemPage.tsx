import { Book as BookIcon } from '@mui/icons-material';
import { PageContainer, PageTitle } from '../components/common/PageBuilders';
import { useParams } from 'react-router-dom';
import { useLibraryItemById } from '../hooks/useLibraryItems';
import { useCopiesOfLibraryItem } from '../hooks/useCopies';
import Paper from '@mui/material/Paper';
import { Suspense, type PropsWithChildren } from 'react';
import { Stack, Typography, Grid, type SxProps } from '@mui/material';
import { type GridColDef } from '@mui/x-data-grid';
import { ItemCopyStatusChip } from '../components/copies/ItemCopyStatusChip';
import { ItemCopyConditionChip } from '../components/copies/ItemCopyConditionChip';
import SimpleGrid from '../components/common/SimpleGrid';
// import { useSnackbar } from '../hooks/useSnackbar';

const copy_columns: GridColDef[] = [
  {
    field: 'copy_label',
    headerName: 'Copy',
    width: 120,
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 150,
    renderCell: (params) => <ItemCopyStatusChip status={params.value} />,
  },
  {
    field: 'condition',
    headerName: 'Condition',
    width: 120,
    renderCell: (params) => <ItemCopyConditionChip condition={params.value} />,
  },
  {
    field: 'current_branch_name',
    headerName: 'Current Location',
    flex: 1,
    minWidth: 150,
  },
  {
    field: 'patron_first_name',
    headerName: 'Checked Out By',
    width: 150,
    valueGetter: (_value, row) => {
      if (row.patron_first_name && row.patron_last_name) {
        return `${row.patron_first_name} ${row.patron_last_name}`;
      }
      return '-';
    },
  },
];

export const Library_Item_Page = () => {
  const { library_item_id } = useParams();
  const { data, isLoading: item_loading } = useLibraryItemById(
    parseInt(library_item_id!)
  );

  const { data: copies, isLoading: copies_loading } = useCopiesOfLibraryItem(
    parseInt(library_item_id!)
  );

  //   const {} = useSnackbar();

  const page_loading = !library_item_id || item_loading;
  return (
    <PageContainer width="xl" sx={{ overflowY: 'auto' }}>
      <Stack spacing={2}>
        <LIP_Section>
          <PageTitle
            loading={page_loading}
            title={page_loading ? 'Library Item' : `${data?.title}`}
            Icon_Component={BookIcon}
          ></PageTitle>
          <Typography variant="subtitle1" color="text.secondary">
            {data?.description}
          </Typography>
        </LIP_Section>

        <Grid container spacing={2}>
          <Suspense fallback={<div>Loading content...</div>}>
            <Grid size={8}>
              <LIP_Section>
                <Stack spacing={2}>
                  <Stack direction={'row'} justifyContent={'space-between'}>
                    <LIP_Field label="Title" value={data?.title || ''} />
                    <LIP_Field label="Author" value={data?.author || ''} />
                  </Stack>
                  <Stack direction={'row'} justifyContent={'space-between'}>
                    <LIP_Field
                      label="Publisher"
                      value={
                        data?.publisher ||
                        data?.audiobook_publisher ||
                        'Unknown'
                      }
                    />
                    <LIP_Field
                      label="Congress Code"
                      value={data?.congress_code || 'N/A'}
                    />
                  </Stack>
                  <Stack direction={'row'} justifyContent={'space-between'}>
                    <LIP_Field
                      label="Genre"
                      value={data?.genre?.join(', ') || 'N/A'}
                    />
                    <LIP_Field
                      label="Number of Pages"
                      value={data?.number_of_pages?.toString() || 'N/A'}
                    />
                    <LIP_Field
                      label="Publication Year"
                      value={data?.publication_year?.toString() || 'N/A'}
                    />
                  </Stack>
                  <LIP_Field
                    label="Description"
                    value={data?.description || 'No description available'}
                  />
                  <Stack direction={'row'} justifyContent={'space-between'}>
                    <LIP_Field
                      label="Total Copies"
                      value={data?.total_copies || 'N/A'}
                    />
                    <LIP_Field
                      label="Available Copies"
                      value={data?.available_copies || 'N/A'}
                    />
                    <LIP_Field
                      label="Checked Out Copies"
                      value={data?.checked_out_copies?.toString() || 'N/A'}
                    />
                  </Stack>
                </Stack>
              </LIP_Section>
              <LIP_Section sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Available Copies ({copies?.length || 0})
                </Typography>
                <SimpleGrid
                  rows={copies || []}
                  cols={copy_columns}
                  loading={copies_loading}
                />
              </LIP_Section>
            </Grid>
            <Grid size={4}>
              <img
                style={{ width: '97%', borderRadius: '8px' }}
                src={data?.cover_image_url || data?.audiobook_cover_image || ''}
                alt={`Cover image of ${data?.title || ''}`}
              />
            </Grid>
          </Suspense>
        </Grid>
      </Stack>
    </PageContainer>
  );
};

// function get_content(item: Library_Item) {
//   switch (item.item_type) {
//     case Library_Item_Type.Audiobook:
//       return Audiobook_Content({ audiobook: item as Audiobook });
//     case Library_Item_Type.Book:
//       return Book_Content({ book: item as Book });
//     case Library_Item_Type.CD:
//       return CD_Content({ cd: item as CD });
//     case Library_Item_Type.Magazine:
//       return Magazine_Content({ magazine: item as Magazine });
//     case Library_Item_Type.Periodical:
//       return Periodical_Content({ periodical: item as Periodical });
//     case Library_Item_Type.Recording:
//       return Recording_Content({ recording: item as Recording });
//     case Library_Item_Type.Video:
//       return Video_Content({ video: item as Video });
//     case Library_Item_Type.Vinyl:
//       return Vinyl_Content({ vinyl: item as Vinyl });
//   }
// }

// function Audiobook_Content({ audiobook }: { audiobook: Audiobook }) {
//   return (
//     <LIP_Section>
{
  /* <Stack spacing={2}>
        <Stack direction={'row'} justifyContent={'space-between'}>
          <LIP_Field label="Title" value={audiodata.title} />
          <LIP_Field label="Narrator" value={audiodata.narrator} />
          <LIP_Field label="Author" value={audiodata.author} />
        </Stack>
        <LIP_Field label="Publisher" value={audiodata.publisher} />
        <LIP_Field
          label="Duration"
          value={`${audiodata.audiobook_duration} seconds`}
        />
        <LIP_Field
          label="Publication Year"
          value={audiodata.publication_year?.toString() || 'N/A'}
        />
        <LIP_Field
          label="Description"
          value={audiodata.description || 'No description available'}
        />
        <LIP_Field label="Congress Code" value={audiodata.congress_code} />
        <LIP_Field label="Total Copies" value={audiodata.total_copies} />
        <LIP_Field
          label="Available Copies"
          value={audiodata.available_copies}
        />
        <LIP_Field
          label="Checked Out Copies"
          value={audiodata.checked_out_copies}
        />
      </Stack> */
}
//     </LIP_Section>
//   );
// }

// function Book_Content({ _ }: { book: Book }) {
//   return <></>;
// }

// function CD_Content({ cd }: { cd: CD }) {
//   return (
//     <LIP_Section>
//       <Stack spacing={2}>
//         <LIP_Field label="Title" value={cd.title} />
//         <LIP_Field label="Artist" value={cd.cd_artist} />
//         <LIP_Field label="Record Label" value={cd.record_label} />
//         <LIP_Field label="Number of Tracks" value={cd.cd_tracks} />
//         <LIP_Field
//           label="Publication Year"
//           value={cd.publication_year?.toString() || 'N/A'}
//         />
//         <LIP_Field
//           label="Description"
//           value={cd.description || 'No description available'}
//         />
//         <LIP_Field label="Congress Code" value={cd.congress_code} />
//         <LIP_Field label="Total Copies" value={cd.total_copies} />
//         <LIP_Field label="Available Copies" value={cd.available_copies} />
//         <LIP_Field label="Checked Out Copies" value={cd.checked_out_copies} />
//       </Stack>
//     </LIP_Section>
//   );
// }

// function Magazine_Content({ magazine }: { magazine: Magazine }) {
//   return (
//     <LIP_Section>
//       <Stack spacing={2}>
//         <LIP_Field label="Title" value={magazine.title} />
//         <LIP_Field label="Publisher" value={magazine.publisher} />
//         <LIP_Field
//           label="Publication Year"
//           value={magazine.publication_year?.toString() || 'N/A'}
//         />
//         <LIP_Field
//           label="Description"
//           value={magazine.description || 'No description available'}
//         />
//         <LIP_Field label="Congress Code" value={magazine.congress_code} />
//         <LIP_Field label="Total Copies" value={magazine.total_copies} />
//         <LIP_Field label="Available Copies" value={magazine.available_copies} />
//         <LIP_Field
//           label="Checked Out Copies"
//           value={magazine.checked_out_copies}
//         />
//       </Stack>
//     </LIP_Section>
//   );
// }

// function Periodical_Content({ periodical }: { periodical: Periodical }) {
//   return (
//     <LIP_Section>
//       <Stack spacing={2}>
//         <LIP_Field label="Title" value={periodical.title} />
//         <LIP_Field label="Publisher" value={periodical.publisher} />
//         <LIP_Field
//           label="Publication Year"
//           value={periodical.publication_year?.toString() || 'N/A'}
//         />
//         <LIP_Field
//           label="Description"
//           value={periodical.description || 'No description available'}
//         />
//         <LIP_Field label="Congress Code" value={periodical.congress_code} />
//         <LIP_Field label="Total Copies" value={periodical.total_copies} />
//         <LIP_Field
//           label="Available Copies"
//           value={periodical.available_copies}
//         />
//         <LIP_Field
//           label="Checked Out Copies"
//           value={periodical.checked_out_copies}
//         />
//       </Stack>
//     </LIP_Section>
//   );
// }

// function Recording_Content({ recording }: { recording: Recording }) {
//   return (
//     <LIP_Section>
//       <Stack spacing={2}>
//         <LIP_Field label="Title" value={recording.title} />
//         <LIP_Field label="Artist" value={recording.cd_artist} />
//         <LIP_Field label="Record Label" value={recording.record_label} />
//         <LIP_Field label="Number of Tracks" value={recording.cd_tracks} />
//         <LIP_Field
//           label="Publication Year"
//           value={recording.publication_year?.toString() || 'N/A'}
//         />
//         <LIP_Field
//           label="Description"
//           value={recording.description || 'No description available'}
//         />
//         <LIP_Field label="Congress Code" value={recording.congress_code} />
//         <LIP_Field label="Total Copies" value={recording.total_copies} />
//         <LIP_Field
//           label="Available Copies"
//           value={recording.available_copies}
//         />
//         <LIP_Field
//           label="Checked Out Copies"
//           value={recording.checked_out_copies}
//         />
//       </Stack>
//     </LIP_Section>
//   );
// }

// function Video_Content({ video }: { video: Video }) {
//   return (
//     <LIP_Section>
//       <Stack spacing={2}>
//         <LIP_Field label="Title" value={video.title} />
//         <LIP_Field label="Director" value={video.director} />
//         <LIP_Field label="Studio" value={video.studio} />
//         <LIP_Field label="Format" value={video.video_format} />
//         <LIP_Field
//           label="Duration"
//           value={`${video.duration_minutes} minutes`}
//         />
//         <LIP_Field label="Rating" value={video.video_rating} />
//         <LIP_Field
//           label="Publication Year"
//           value={video.publication_year?.toString() || 'N/A'}
//         />
//         <LIP_Field
//           label="Description"
//           value={video.description || 'No description available'}
//         />
//         <LIP_Field label="Congress Code" value={video.congress_code} />
//         <LIP_Field label="Total Copies" value={video.total_copies} />
//         <LIP_Field label="Available Copies" value={video.available_copies} />
//         <LIP_Field
//           label="Checked Out Copies"
//           value={video.checked_out_copies}
//         />
//       </Stack>
//     </LIP_Section>
//   );
// }

// function Vinyl_Content({ vinyl }: { vinyl: Vinyl }) {
//   return (
//     <LIP_Section>
//       <Stack spacing={2}>
//         <LIP_Field label="Title" value={vinyl.title} />
//         <LIP_Field label="Artist" value={vinyl.artist} />
//         <LIP_Field label="Vinyl Color" value={vinyl.vinyl_color} />
//         <LIP_Field label="Number of Tracks" value={vinyl.vinyl_tracks} />
//         <LIP_Field
//           label="Publication Year"
//           value={vinyl.publication_year?.toString() || 'N/A'}
//         />
//         <LIP_Field
//           label="Description"
//           value={vinyl.description || 'No description available'}
//         />
//         <LIP_Field label="Congress Code" value={vinyl.congress_code} />
//         <LIP_Field label="Total Copies" value={vinyl.total_copies} />
//         <LIP_Field label="Available Copies" value={vinyl.available_copies} />
//         <LIP_Field
//           label="Checked Out Copies"
//           value={vinyl.checked_out_copies}
//         />
//       </Stack>
//     </LIP_Section>
//   );
// }

function LIP_Section({ children, sx }: PropsWithChildren<{ sx?: SxProps }>) {
  return (
    <Paper sx={{ p: 2, borderRadius: 3, boxShadow: 3, ...sx }}>
      {children}
    </Paper>
  );
}

// function LIP_Subsection({ children }: PropsWithChildren) {
//   return (
//     <Paper sx={{ p: 1, borderRadius: 2, boxShadow: 1 }}>{children}</Paper>
//   );
// }

function LIP_Field({ label, value }: { label: string; value: string }) {
  return (
    <Stack spacing={1} sx={{ minWidth: 150, flex: 1 }}>
      <Typography variant="subtitle2" color="text.secondary">
        {label}:
      </Typography>
      <Typography variant="body1">{value}</Typography>
    </Stack>
  );
}
