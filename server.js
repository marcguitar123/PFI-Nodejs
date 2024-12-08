/////////////////////////////////////////////////////////////////////
// This module is the starting point of the http server
/////////////////////////////////////////////////////////////////////
// Author : Nicolas Chourot
// Lionel-Groulx College
/////////////////////////////////////////////////////////////////////

import APIServer from "./APIServer.js";
import RouteRegister from './routeRegister.js';

RouteRegister.add('GET', 'Bookmarks', 'list');
RouteRegister.add('GET', 'accounts');
RouteRegister.add('POST', 'accounts', 'register');
RouteRegister.add('GET', 'accounts', 'verify');
RouteRegister.add('GET', 'accounts', 'logout'); // On fait host/accounts/logout.   On ne fait pas host/api/accounts/logout
RouteRegister.add('PUT', 'accounts', 'modify');
RouteRegister.add('GET', 'accounts', 'remove');
RouteRegister.add('GET', 'accounts', 'conflict');
RouteRegister.add('POST', 'accounts', 'block');
RouteRegister.add('POST', 'accounts', 'promote');
RouteRegister.add('POST', 'postlikes', 'togglelike');

let server = new APIServer();
server.start();