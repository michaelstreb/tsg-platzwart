import { render } from 'preact';
import { App } from './app.jsx';
import './styles/main.css';
import './styles/grid.css';
import './styles/booking.css';
import './styles/admin.css';
import './styles/print.css';

render(<App />, document.getElementById('app'));
