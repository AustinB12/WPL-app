import {
  Avatar,
  Box,
  Grid,
  Paper,
  SvgIcon,
  Typography,
  keyframes,
} from '@mui/material';
import { PageContainer } from '../components/common/PageBuilders';
import {
  React_Icon,
  Type_Script_Icon,
  Mui_Icon,
  Node_Icon,
  Express_Icon,
  Sqlite_Icon,
} from '../components/common/icons';

// Keyframe animations
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const float = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
`;

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.3);
  }
`;
const pulse_soft = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
`;
const morph = keyframes`
  0%, 10%, 100% {
    border-radius: 18px;
    corner-shape: round;
  }
    25%, 35% {
      border-radius: 60px;
      corner-shape: squircle;      
  }
    45%, 55% {
      border-radius: 12px;
      corner-shape: scoop;      
  }
    65%, 75% {
      border-radius: 12px;
      corner-shape: bevel;      
  }
`;

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

// Animated Card wrapper
const Animated_Card = ({
  children,
  delay = 0,
  gradient,
}: {
  children: React.ReactNode;
  delay?: number;
  gradient?: string;
}) => (
  <Paper
    sx={{
      p: 3,
      borderRadius: 4,
      position: 'relative',
      overflow: 'hidden',
      animation: `${fadeInUp} 0.6s ease-out ${delay}s both`,
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
      background: gradient || 'background.paper',
    }}
  >
    {children}
  </Paper>
);

// Section Header with icon and title
const Section_Header = ({
  icon,
  title,
  bgcolor,
  iconSx,
  mb = 2,
}: {
  icon: React.ReactNode;
  title: string;
  bgcolor: string;
  iconSx?: object;
  mb?: number;
}) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb }}>
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2,
        bgcolor,
        color: 'white',
        display: 'flex',
        ...iconSx,
      }}
    >
      {icon}
    </Box>
    <Typography variant='h4' fontWeight={'bold'}>
      {title}
    </Typography>
  </Box>
);

// Tech Stack Card for the grid items
const Tech_Stack_Card = ({
  title,
  color,
  children,
}: {
  title: string;
  color: string;
  children: React.ReactNode;
}) => (
  <Grid
    size={{ xs: 12, sm: 4 }}
    sx={{
      p: 1,
      borderRadius: 2,
      borderLeft: `4px solid ${color}`,
      bgcolor: `${color}0D`,
      transition: 'all 0.3s ease',
      '&:hover': {
        bgcolor: `${color}1A`,
      },
    }}
  >
    <Typography variant='h5' fontWeight={'bold'} sx={{ color, mb: 0.5 }}>
      {title}
    </Typography>
    <Box
      sx={{
        display: 'flex',
        width: '100%',
        justifyContent: 'space-around',
      }}
    >
      {children}
    </Box>
  </Grid>
);

// Decorative SVG components
const Book_Stack_Svg = () => (
  <Box
    sx={{
      position: 'absolute',
      right: 20,
      top: '50%',
      transform: 'translateY(-50%)',
      opacity: 0.1,
      animation: `${float} 4s ease-in-out infinite`,
    }}
  >
    <svg width='120' height='120' viewBox='0 0 24 24' fill='currentColor'>
      <path d='M19 2H6c-1.206 0-3 .799-3 3v14c0 2.201 1.794 3 3 3h15v-2H6.012C5.55 19.988 5 19.806 5 19s.55-.988 1.012-1H21V4c0-1.103-.897-2-2-2zm0 14H5V5c0-.806.55-.988 1-1h13v12z' />
      <path d='M9 6h2v2H9zm0 4h2v2H9zm0 4h2v2H9z' />
    </svg>
  </Box>
);

const Code_Brackets_Svg = () => (
  <Box
    sx={{
      position: 'absolute',
      right: 30,
      top: 30,
      opacity: 0.08,
      animation: `${pulse} 3s ease-in-out infinite`,
    }}
  >
    <svg width='100' height='100' viewBox='0 0 24 24' fill='currentColor'>
      <path d='M8.293 6.293L2.586 12l5.707 5.707 1.414-1.414L5.414 12l4.293-4.293zm7.414 0l-1.414 1.414L18.586 12l-4.293 4.293 1.414 1.414L21.414 12z' />
    </svg>
  </Box>
);

const Database_Svg = () => (
  <Box
    sx={{
      position: 'absolute',
      right: '10%',
      bottom: '10%',
      opacity: 0.08,
      animation: `${float} 5s ease-in-out infinite 0.5s`,
    }}
  >
    <svg width='80' height='80' viewBox='0 0 80 80' fill='currentColor'>
      <path
        d='M33.3333 0C14.9533 0 0 7.47667 0 16.6667V50C0 59.19 14.9533 66.6667 33.3333 66.6667C51.7133 66.6667 66.6667 59.19 66.6667 50V16.6667C66.6667 7.47667 51.7133 0 33.3333 0ZM33.3333 6.66667C48.0367 6.66667 60 12.6467 60 16.6667C60 20.6867 48.0367 26.6667 33.3333 26.6667C18.63 26.6667 6.66667 20.6867 6.66667 16.6667C6.66667 12.6467 18.63 6.66667 33.3333 6.66667ZM6.66667 50V36.01C7.33333 41.3333 30.3333 43.3333 33.3333 43.3333C36.3333 43.3333 58.3333 41.3333 60 36.01V50C60 54.02 48.0367 60 33.3333 60C18.63 60 6.66667 54.02 6.66667 50ZM6.66667 33.3333V22.6767C12.6933 26.7533 22.37 30 33.3333 30C44.2967 30 53.9733 26.7533 60 22.6767V33.3333C60 37.3333 42.3333 41.3333 33.3333 41.3333C24.3333 41.3333 6.66667 37.8333 6.66667 33.3333Z'
        fill='black'
      />
    </svg>
  </Box>
);

// Tech Stack Icon Component
const Tech_Icon = ({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 0.5,
      p: 1,
      borderRadius: 2,
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      '&:hover': {
        transform: 'translateY(-2px) scale(1.1)',
        '& svg': {
          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
        },
      },
    }}
  >
    <Box
      sx={{
        transition: 'filter 0.3s ease',
        width: { xs: '24px', sm: '32px' },
        height: { xs: '24px', sm: '32px' },
      }}
    >
      {icon}
    </Box>
    <Typography variant='caption' sx={{ fontWeight: 500, opacity: 0.8 }}>
      {label}
    </Typography>
  </Box>
);

// Animated Wave Background
const Wave_Background = ({ color }: { color: string }) => (
  <Box
    sx={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 80,
      overflow: 'hidden',
      pointerEvents: 'none',
    }}
  >
    <svg
      viewBox='0 0 500 150'
      preserveAspectRatio='none'
      style={{ width: '100%', height: '100%' }}
    >
      <path fill={color}>
        <animate
          attributeName='d'
          dur='4s'
          repeatCount='indefinite'
          calcMode='spline'
          keySplines='0.42 0 0.58 1; 0.42 0 0.58 1'
          values='
            M0,64 C150,100 350,0 500,64 L500,150 L0,150 Z;
            M0,64 C150,0 350,100 500,64 L500,150 L0,150 Z;
            M0,64 C150,100 350,0 500,64 L500,150 L0,150 Z
          '
        />
      </path>
      <path fill={color}>
        <animate
          attributeName='d'
          begin={'1s'}
          dur='4s'
          repeatCount='indefinite'
          calcMode='spline'
          keySplines='0.42 0 0.58 1; 0.42 0 0.58 1'
          values='
            M0,64 C150,100 350,0 500,64 L500,150 L0,150 Z;
            M0,64 C150,0 350,100 500,64 L500,150 L0,150 Z;
            M0,64 C150,100 350,0 500,64 L500,150 L0,150 Z
          '
        />
      </path>
      <path fill={color}>
        <animate
          attributeName='d'
          begin={'2s'}
          dur='4s'
          repeatCount='indefinite'
          calcMode='spline'
          keySplines='0.42 0 0.58 1; 0.42 0 0.58 1'
          values='
            M0,64 C150,100 350,0 500,64 L500,150 L0,150 Z;
            M0,64 C150,0 350,100 500,64 L500,150 L0,150 Z;
            M0,64 C150,100 350,0 500,64 L500,150 L0,150 Z
          '
        />
      </path>
    </svg>
  </Box>
);

// Floating Particles
const Floating_Particle = ({
  size,
  delay,
  duration,
  left,
  top,
}: {
  size: number;
  delay: number;
  duration: number;
  left: string;
  top: string;
}) => (
  <Box
    sx={{
      position: 'absolute',
      width: size,
      height: size,
      borderRadius: '50%',
      bgcolor: 'primary.main',
      opacity: 0.1,
      left,
      top,
      animation: `${float} ${duration}s ease-in-out infinite ${delay}s`,
      pointerEvents: 'none',
    }}
  />
);

// Particle Group - renders multiple floating particles from config
type Particle_Config = {
  size: number;
  delay: number;
  duration: number;
  left: string;
  top: string;
};

const Particle_Group = ({ particles }: { particles: Particle_Config[] }) => (
  <>
    {particles.map((p, i) => (
      <Floating_Particle key={i} {...p} />
    ))}
  </>
);

// Interest Badge with animation
const Interest_Badge = ({ label, index }: { label: string; index: number }) => (
  <Box
    sx={{
      px: 2,
      py: 0.5,
      borderRadius: 5,
      bgcolor: 'action.hover',
      fontSize: '0.875rem',
      animation: `${fadeInUp} 0.4s ease-out ${0.5 + index * 0.1}s both`,
      transition: 'all 0.2s ease',
      cursor: 'default',
      '&:hover': {
        bgcolor: 'primary.main',
        color: 'white',
        transform: 'scale(1.05)',
      },
    }}
  >
    {label}
  </Box>
);

// Particle configs for reuse
const TECH_STACK_PARTICLES: Particle_Config[] = [
  { size: 20, delay: 0, duration: 4, left: '10%', top: '20%' },
  { size: 12, delay: 1, duration: 5, left: '80%', top: '60%' },
  { size: 16, delay: 2, duration: 4.5, left: '60%', top: '15%' },
];

const ABOUT_ME_PARTICLES: Particle_Config[] = [
  { size: 14, delay: 0.5, duration: 4, left: '85%', top: '25%' },
  { size: 18, delay: 1.5, duration: 5, left: '5%', top: '70%' },
  { size: 14, delay: 0.5, duration: 4, left: '44%', top: '67%' },
  { size: 18, delay: 0.5, duration: 5, left: '89%', top: '58%' },
  { size: 18, delay: 0.75, duration: 5, left: '94%', top: '73%' },
  { size: 18, delay: 0.25, duration: 5, left: '87%', top: '80%' },
];

const INTERESTS = [
  '🌱 Gardening',
  '🏋️ Weight-lifting',
  '🎮 Video Games',
  '👨‍👧 Family Time',
];

export const Home_Page = () => {
  return (
    <PageContainer width='lg' scroll={true} sx={{ height: 'inherit' }}>
      <Box
        sx={{
          background: `background: #3A86FF;
background: linear-gradient(90deg, rgba(58, 134, 255, 1) 0%, rgba(131, 56, 236, 1) 25%, rgba(255, 0, 110, 1) 50%, rgba(251, 86, 7, 1) 75%, rgba(255, 190, 11, 1) 100%);`,
          textTransform: 'uppercase',
          WebkitTextFillColor: 'transparent',
          WebkitBackgroundClip: 'text',
        }}
      >
        <Typography
          variant='h4'
          fontWeight={'800'}
          fontFamily={'Arial, sans-serif'}
          sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } }}
        >
          {'Wayback Public Library'}
        </Typography>
      </Box>

      {/* About Me Section */}
      <Animated_Card delay={0.3}>
        <Particle_Group particles={ABOUT_ME_PARTICLES} />

        <Box sx={{ position: 'relative', zIndex: 1, pb: 4 }}>
          <Section_Header
            icon={
              <svg
                width='28'
                height='28'
                viewBox='0 0 24 24'
                fill='currentColor'
              >
                <path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' />
              </svg>
            }
            title='Austin Baird'
            bgcolor='#8338ec'
            iconSx={{
              cornerShape: 'scoop',
              borderRadius: '12px',
              '&:hover': {
                animation: `${morph} 3.5s ease-in-out infinite`,
              },
            }}
            mb={3}
          />

          <Box
            sx={{
              display: 'flex',
              gap: 3,
              alignItems: 'flex-start',
              flexWrap: { xs: 'wrap', md: 'nowrap' },
            }}
          >
            <Box
              sx={{
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  inset: -5,
                  borderRadius: '50%',
                  background: `background: #3A86FF;
background: linear-gradient(90deg, rgba(58, 134, 255, 1) 0%, rgba(131, 56, 236, 1) 25%, rgba(255, 0, 110, 1) 50%, rgba(251, 86, 7, 1) 75%, rgba(255, 190, 11, 1) 100%);`,
                  animation: `${rotate} 6s linear infinite`,
                  zIndex: -1,
                },
              }}
            >
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  border: '0px solid',
                  borderColor: 'background.paper',
                  transition: 'transform 0.3s ease',
                }}
                src='https://media.licdn.com/dms/image/v2/C4D03AQF2qs6pZiimMg/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1576023146183?e=1769040000&v=beta&t=NytL_qq2fxvZXKa9aLKQ1R8cVRezocfPVHjt5TK_I58'
              />
            </Box>
            <Box>
              <Typography variant='body1' gutterBottom sx={{ lineHeight: 1.8 }}>
                {
                  "I'm a full-stack developer passionate about building useful applications that solve real problems. I enjoy working full-stack, from database design to user interface implementation."
                }
              </Typography>
              <Typography variant='body1' sx={{ lineHeight: 1.8 }}>
                {
                  "When I'm not coding, I enjoy gardening, weight-lifting, video games, and hanging out with my daughter."
                }
              </Typography>

              {/* Interest badges */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                {INTERESTS.map((interest, i) => (
                  <Interest_Badge key={interest} label={interest} index={i} />
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
        <Wave_Background color='#8338ec20' />
      </Animated_Card>

      {/* What is this section */}
      <Animated_Card delay={0.1}>
        <Book_Stack_Svg />
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            pb: 4,
          }}
        >
          <Section_Header
            icon={<Typography fontSize={'1.5rem'}>🤔</Typography>}
            title='What is this?'
            bgcolor='#ff006e'
            iconSx={{
              '&:hover .MuiTypography-root': {
                animation: `${pulse} 1.5s ease-in-out infinite`,
              },
            }}
          />
          <Typography variant='body1' sx={{ mb: 1, fontSize: '1.1rem' }}>
            {'Great question!'}
          </Typography>
          <Typography variant='body1' sx={{ lineHeight: 1.8 }}>
            This is a personal project I've created. It is an admin system
            management interface for a fictional library:{' '}
            <strong>Wayback Public Library</strong>
          </Typography>
        </Box>
        <Wave_Background color='#ff006e20' />
      </Animated_Card>

      {/* Tech Stack Section */}
      <Animated_Card delay={0.2}>
        <Code_Brackets_Svg />
        <Database_Svg />
        <Particle_Group particles={TECH_STACK_PARTICLES} />

        <Box sx={{ position: 'relative', zIndex: 1, pb: 4 }}>
          <Section_Header
            icon={
              <svg
                width='28'
                height='28'
                viewBox='0 0 24 24'
                fill='currentColor'
              >
                <path d='M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z'>
                  <animateTransform
                    attributeName='transform'
                    type='rotate'
                    from='0 12 12'
                    to='360 12 12'
                    dur='10s'
                    repeatCount='indefinite'
                  />
                </path>
              </svg>
            }
            title='Tech Stack'
            bgcolor='#ffbe0b'
            mb={3}
          />
          <Grid container spacing={2}>
            <Tech_Stack_Card title=' UI' color='#ffbe0b'>
              <Tech_Icon icon={<React_Icon />} label='React' />
              <Tech_Icon icon={<Type_Script_Icon />} label='TypeScript' />
              <Tech_Icon icon={<Mui_Icon />} label='Material UI' />
            </Tech_Stack_Card>

            <Tech_Stack_Card title='API' color='#ffbe0b'>
              <Tech_Icon icon={<Node_Icon />} label='Node.js' />
              <Tech_Icon icon={<Express_Icon />} label='Express' />
            </Tech_Stack_Card>

            <Tech_Stack_Card title='DB' color='#ffbe0b'>
              <Tech_Icon icon={<Sqlite_Icon />} label='SQLite' />
            </Tech_Stack_Card>
          </Grid>

          <Box sx={{ mt: 3 }}>
            <Github_Icon />
          </Box>
        </Box>
        <Wave_Background color='#ffbe0b20' />
      </Animated_Card>
    </PageContainer>
  );
};

const Github_Icon = () => {
  const handleClick = () => {
    window.open('https://github.com/AustinB12/WPL-app', '_blank');
  };

  return (
    <Box
      onClick={handleClick}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1.5,
        px: 3,
        py: 1.5,
        borderRadius: 3,
        bgcolor: 'action.hover',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': {
          bgcolor: 'background.default',
          transform: 'translateY(-1px)',
          boxShadow: 2,
          '& .github-icon': {
            animation: `${pulse_soft} 1s ease-in-out infinite`,
          },
        },
      }}
    >
      <SvgIcon
        className='github-icon'
        sx={{
          fontSize: 28,
          transition: 'all 0.3s ease',
        }}
      >
        <svg viewBox='0 0 20 20' fill='currentColor'>
          <path d='M10,0 C15.523,0 20,4.59 20,10.253 C20,14.782 17.138,18.624 13.167,19.981 C12.66,20.082 12.48,19.762 12.48,19.489 C12.48,19.151 12.492,18.047 12.492,16.675 C12.492,15.719 12.172,15.095 11.813,14.777 C14.04,14.523 16.38,13.656 16.38,9.718 C16.38,8.598 15.992,7.684 15.35,6.966 C15.454,6.707 15.797,5.664 15.252,4.252 C15.252,4.252 14.414,3.977 12.505,5.303 C11.706,5.076 10.85,4.962 10,4.958 C9.15,4.962 8.295,5.076 7.497,5.303 C5.586,3.977 4.746,4.252 4.746,4.252 C4.203,5.664 4.546,6.707 4.649,6.966 C4.01,7.684 3.619,8.598 3.619,9.718 C3.619,13.646 5.954,14.526 8.175,14.785 C7.889,15.041 7.63,15.493 7.54,16.156 C6.97,16.418 5.522,16.871 4.63,15.304 C4.63,15.304 4.101,14.319 3.097,14.247 C3.097,14.247 2.122,14.234 3.029,14.87 C3.029,14.87 3.684,15.185 4.139,16.37 C4.139,16.37 4.726,18.2 7.508,17.58 C7.513,18.437 7.522,19.245 7.522,19.489 C7.522,19.76 7.338,20.077 6.839,19.982 C2.865,18.627 0,14.783 0,10.253 C0,4.59 4.478,0 10,0' />
        </svg>
      </SvgIcon>
      <Typography variant='body2' fontWeight={600}>
        View on GitHub
      </Typography>
      <svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor'>
        <path d='M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z' />
      </svg>
    </Box>
  );
};
