import { useContext } from 'react';
import { UNSAFE_LocationContext } from 'react-router-dom';
import { localeFromPath } from './localizedRoutes.js';

export { localeFromPath, localizedPath } from './localizedRoutes.js';

// Components rendered without a router (such as standalone form controls) use English.
export const useLocale = () => localeFromPath(useContext(UNSAFE_LocationContext)?.location.pathname ?? '/');
