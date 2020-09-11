import useMediaQuery from '@material-ui/core/useMediaQuery';
import React from 'react';
import { createMuiTheme } from '@material-ui/core/styles';

export default () => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  return React.useMemo(
    () =>
      createMuiTheme({
        palette: {
          type: prefersDarkMode ? 'dark' : 'light',
        },
      }),
    [prefersDarkMode],
  );
};
