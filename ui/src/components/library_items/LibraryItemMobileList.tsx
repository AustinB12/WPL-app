import { Delete, Edit, ExpandMore, ReadMore } from '@mui/icons-material';
import {
  Accordion,
  AccordionActions,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  CircularProgress,
  IconButton,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import type { Library_Item } from '../../types/item_types';
import Item_Type_Chip from './ItemTypeChip';

interface Library_Item_Mobile_List_Props {
  items: Library_Item[] | undefined;
  loading: boolean;
  on_details_click: (item: Library_Item) => void;
  on_edit_click: (item: Library_Item) => void;
  on_delete_click: (item: Library_Item) => void;
  on_item_double_click: (item: Library_Item) => void;
}

export const Library_Item_Mobile_List = ({
  items,
  loading,
  on_details_click,
  on_edit_click,
  on_delete_click,
  on_item_double_click,
}: Library_Item_Mobile_List_Props) => {
  const [expanded, setExpanded] = useState<number | false>(false);

  const handleAccordionChange =
    (itemId: number) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? itemId : false);
    };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '50vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!items || items.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '50vh',
        }}
      >
        <Typography variant='body1' color='text.secondary'>
          No library items found
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={1} sx={{ p: 0.5, pb: 1, overflow: 'auto' }}>
      {items.map((item) => (
        <Accordion
          key={item.id}
          expanded={expanded === item.id}
          onChange={handleAccordionChange(item.id)}
          sx={{
            '&:before': { display: 'none' },
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMore />}
            sx={{
              minHeight: 80,
              maxWidth: '100%',
              px: 0.5,
              '> .MuiAccordionSummary-content': {
                m: '0px !important',
                pl: 1,
                flex: 1,
                overflow: 'hidden',
              },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flex: 1,
                alignItems: 'center',
                gap: 2,
                pr: 1,
                overflow: 'hidden',
              }}
            >
              {item.cover_image_url && (
                <CardMedia
                  component='img'
                  image={item.cover_image_url}
                  alt={item.title}
                  sx={{
                    width: 40,
                    height: 60,
                    objectFit: 'cover',
                    borderRadius: 1,
                    flexShrink: 0,
                  }}
                />
              )}
              <Box
                sx={{
                  flex: 1,
                  minWidth: 0,
                  overflow: 'hidden',
                  maxWidth: 'calc(100% - 48px)',
                }}
              >
                <ListItemText
                  secondary={
                    <Item_Type_Chip item_type={item.item_type} size='small' />
                  }
                >
                  <Typography
                    variant='subtitle1'
                    sx={{
                      maxWidth: '100%',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}
                    textOverflow={'ellipsis'}
                    overflow={'hidden'}
                  >
                    {item.title}
                  </Typography>
                </ListItemText>
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ py: 0 }}>
            <Card variant='outlined'>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1 } }}>
                {item.description && (
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ mb: 0.5 }}
                  >
                    {item.description}
                  </Typography>
                )}
                <Stack direction='row' spacing={2} flexWrap='wrap' useFlexGap>
                  {item.publication_year && (
                    <Typography variant='caption' color='text.secondary'>
                      <strong>Year:</strong> {item.publication_year}
                    </Typography>
                  )}
                  <Typography variant='caption' color='text.secondary'>
                    <strong>ID:</strong> {item.id}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </AccordionDetails>
          <AccordionActions
            sx={{ px: 2, pb: 2, justifyContent: 'space-between' }}
          >
            <Button
              size='small'
              variant='contained'
              onClick={() => on_item_double_click(item)}
            >
              View Page
            </Button>
            <Stack direction='row' gap={1}>
              <IconButton size='small' onClick={() => on_details_click(item)}>
                <ReadMore color='primary' />
              </IconButton>
              <IconButton size='small' onClick={() => on_edit_click(item)}>
                <Edit color='primary' />
              </IconButton>
              <IconButton size='small' onClick={() => on_delete_click(item)}>
                <Delete color='error' />
              </IconButton>
            </Stack>
          </AccordionActions>
        </Accordion>
      ))}
    </Stack>
  );
};
