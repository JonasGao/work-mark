import React from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';
import { ThemeProvider } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';
import useSystemTheme from './useSystemTheme';

export default ({ children }: { children: React.ReactNode }) => {
  const theme = useSystemTheme();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container>{children}</Container>
    </ThemeProvider>
  );
};
