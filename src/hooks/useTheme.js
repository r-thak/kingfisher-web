import { useContext } from 'react';
import ThemeContext from '../context/themeContextValue';

export default function useTheme() {
  return useContext(ThemeContext);
}
