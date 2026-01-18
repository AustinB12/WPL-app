import { ErrorOutline, Refresh } from '@mui/icons-material';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    // Log error to console in development
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100%',
            p: 3,
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              maxWidth: 600,
              textAlign: 'center',
              borderRadius: 3,
            }}
          >
            <Stack spacing={3} alignItems='center'>
              <ErrorOutline
                sx={{ fontSize: 64, color: 'error.main', opacity: 0.8 }}
              />
              <Typography variant='h5' fontWeight='bold' color='error.main'>
                Something went wrong
              </Typography>
              <Typography variant='body1' color='text.secondary'>
                An unexpected error occurred. You can try refreshing the page or
                going back.
              </Typography>

              {/* Show error details in development */}
              {import.meta.env.DEV && this.state.error && (
                <Paper
                  variant='outlined'
                  sx={{
                    p: 2,
                    width: '100%',
                    textAlign: 'left',
                    overflow: 'auto',
                    maxHeight: 200,
                  }}
                >
                  <Typography
                    variant='caption'
                    component='pre'
                    sx={{
                      fontFamily: 'monospace',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      m: 0,
                    }}
                  >
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack && (
                      <>
                        {'\n\nComponent Stack:'}
                        {this.state.errorInfo.componentStack}
                      </>
                    )}
                  </Typography>
                </Paper>
              )}

              <Stack direction='row' spacing={2}>
                <Button
                  variant='outlined'
                  startIcon={<Refresh />}
                  onClick={this.handleReset}
                >
                  Try Again
                </Button>
                <Button
                  variant='contained'
                  startIcon={<Refresh />}
                  onClick={this.handleReload}
                >
                  Reload Page
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}
