// Add support for things like setTimeout, setInterval and fetch.
// Simply importing this sets all these as global definitions.
// They are declared in the .eslintrc so your editor won't complain.
import 'magic-script-polyfills';
import './global-scope.js';

import React from 'react';
import mxs from 'magic-script-components';

// Load main app logic from the app class.
import MyApp from './app.js';

mxs.bootstrap(<MyApp type='landscape' volumeSize={[1,1,1]} caption='My App Caption' message='Hello Components' />);
